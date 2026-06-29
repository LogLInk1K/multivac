import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATHS = {
  posts: path.resolve(__dirname, '../post'),
  twikoo: path.resolve(__dirname, '../twikoo_template'),
  configYaml: path.resolve(__dirname, '../config.multivac.yaml'),
  tempVault: path.join(os.tmpdir(), 'multivac_temp_vault'),
};

interface BackupConfig {
  enabled?: boolean;
  repo_url?: string;
  sync_post?: boolean;
  sync_twikoo?: boolean;
  sync_config?: boolean;
}

interface MultivacConfig {
  backup?: BackupConfig;
  [key: string]: unknown;
}

async function main() {
  console.log('[Backup] 启动自动化备份任务...\n');

  // 1. 读取并解析配置文件
  if (!fs.existsSync(PATHS.configYaml)) {
    console.error('\x1b[31m%s\x1b[0m', '[Error] 未检测到 [config.multivac.yaml] 配置文件，流程终止。');
    process.exit(1);
  }

  let config: MultivacConfig = {};
  try {
    const fileContent = fs.readFileSync(PATHS.configYaml, 'utf-8');
    config = (YAML.parse(fileContent) as MultivacConfig | null) ?? {};
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '[Error] 解析 config.multivac.yaml 失败，请检查格式。', err);
    process.exit(1);
  }

  const backupConfig = config.backup;

  // 2. 校验总开关：必须显式设为 true
  if (!backupConfig || backupConfig.enabled !== true) {
    console.log('\x1b[33m%s\x1b[0m', '[Info] 备份功能未开启 (backup.enabled 不为 true)，流程安全退出。');
    return;
  }

  const PRIVATE_REPO_URL = backupConfig.repo_url;
  if (!PRIVATE_REPO_URL) {
    console.error('\x1b[31m%s\x1b[0m', '[Error] 配置文件中未检测到 [backup.repo_url] 仓库地址，流程终止。');
    process.exit(1);
  }

  // 3. 严格判定：只有显式设为 true 且本地文件存在时，才进行同步
  const hasPost = fs.existsSync(PATHS.posts) && backupConfig.sync_post === true;
  const hasTwikoo = fs.existsSync(PATHS.twikoo) && backupConfig.sync_twikoo === true;
  const hasConfig = fs.existsSync(PATHS.configYaml) && backupConfig.sync_config === true;

  // 如果所有项都没开启，则无需继续后面的 Git 流程
  if (!hasPost && !hasTwikoo && !hasConfig) {
    console.log(
      '\x1b[33m%s\x1b[0m',
      '[Info] 未开启任何子模块的同步开关（sync_post/sync_twikoo/sync_config 均不为 true），流程终止。'
    );
    return;
  }

  try {
    if (fs.existsSync(PATHS.tempVault)) {
      fs.rmSync(PATHS.tempVault, { recursive: true, force: true });
    }

    // 4. 拉取远端仓库
    console.log('[Sync] 正在同步远程仓库状态...');
    try {
      execSync(`git clone --depth 1 -b main ${PRIVATE_REPO_URL} "${PATHS.tempVault}"`, { stdio: 'ignore' });
      execSync(`git config core.autocrlf false`, { cwd: PATHS.tempVault });
      execSync(`git config core.safecrlf false`, { cwd: PATHS.tempVault });
    } catch {
      fs.mkdirSync(PATHS.tempVault, { recursive: true });
      execSync(`git init`, { cwd: PATHS.tempVault, stdio: 'ignore' });
      execSync(`git config core.autocrlf false`, { cwd: PATHS.tempVault });
      execSync(`git checkout -B main`, { cwd: PATHS.tempVault, stdio: 'ignore' });
      execSync(`git remote add origin ${PRIVATE_REPO_URL}`, { cwd: PATHS.tempVault, stdio: 'ignore' });
    }

    // 5. 精确清理中转区：只清理被明确启用同步的目录，保护远端其他未开启同步的数据
    if (hasPost && fs.existsSync(path.join(PATHS.tempVault, 'post'))) {
      fs.rmSync(path.join(PATHS.tempVault, 'post'), { recursive: true, force: true });
    }
    if (hasTwikoo && fs.existsSync(path.join(PATHS.tempVault, 'twikoo_template'))) {
      fs.rmSync(path.join(PATHS.tempVault, 'twikoo_template'), { recursive: true, force: true });
    }
    if (hasConfig && fs.existsSync(path.join(PATHS.tempVault, 'config.multivac.yaml'))) {
      fs.rmSync(path.join(PATHS.tempVault, 'config.multivac.yaml'), { force: true });
    }

    // 6. 按需复制有效变更
    if (hasPost) copyFolderSync(PATHS.posts, path.join(PATHS.tempVault, 'post'));
    if (hasTwikoo) copyFolderSync(PATHS.twikoo, path.join(PATHS.tempVault, 'twikoo_template'));
    if (hasConfig) fs.copyFileSync(PATHS.configYaml, path.join(PATHS.tempVault, 'config.multivac.yaml'));

    // 7. 对比状态与推送
    execSync(`git add .`, { cwd: PATHS.tempVault });
    const status = execSync(`git status --porcelain`, { cwd: PATHS.tempVault }).toString().trim();

    let pushSuccess = false;
    if (!status) {
      console.log('[Skip] 检测到远程备份与本地完全一致，无需更新。');
    } else {
      console.log(`[Sync] 检测到本地有文件变更，正在推送至远程 main 分支...`);
      const commitMessage = `Vault Backup: ${new Date().toISOString()}`;
      execSync(`git commit -m "${commitMessage}"`, { cwd: PATHS.tempVault, stdio: 'ignore' });
      execSync(`git push -u origin main --force`, { cwd: PATHS.tempVault, stdio: 'inherit' });
      pushSuccess = true;
    }

    // 8. 打印收尾报告看板
    console.log('\n========================================');
    console.log('🎉 自动化同步流程快报');
    console.log('========================================');
    console.log(`${hasPost ? ' \x1b[32m[✓]\x1b[0m post/' : ' \x1b[33m[-]已关闭或未就绪(跳过)\x1b[0m post/'}`);
    console.log(
      `${hasTwikoo ? ' \x1b[32m[✓]\x1b[0m twikoo_template/' : ' \x1b[33m[-]已关闭或未就绪(跳过)\x1b[0m twikoo_template/'}`
    );
    console.log(
      `${hasConfig ? ' \x1b[32m[✓]\x1b[0m config.multivac.yaml' : ' \x1b[33m[-]已关闭(跳过)\x1b[0m config.multivac.yaml'}`
    );
    console.log('----------------------------------------');
    if (pushSuccess) {
      console.log(`\x1b[32m[Result] 远程 main 分支数据更新成功！\x1b[0m`);
    } else {
      console.log(`\x1b[34m[Result] 远端数据已是最新，无变动。\x1b[0m`);
    }
    console.log('========================================\n');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '[Fatal] 脚本异常中断:', error);
  } finally {
    if (fs.existsSync(PATHS.tempVault)) {
      fs.rmSync(PATHS.tempVault, { recursive: true, force: true });
    }
  }
}

function copyFolderSync(from: string, to: string) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    if (element === '.git') return;
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

main();
