// scripts/backup.js
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const PRIVATE_REPO_URL = process.env.PRIVATE_POSTS_REPO_URL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATHS = {
  posts: path.resolve(__dirname, '../post'),
  twikoo: path.resolve(__dirname, '../twikoo_template'),
  tempVault: path.join(os.tmpdir(), 'multivac_temp_vault')
};

/**
 * 递归复制文件夹
 */
function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (element === '.git') return;
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

async function main() {
  console.log('[Backup] 启动同步...\n');

  if (!PRIVATE_REPO_URL) {
    console.error('[Error] 未检测到 [PRIVATE_POSTS_REPO_URL] 环境变量。');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const askPost = await rl.question('? 是否同步 [post/] 文件夹？(y/n, 默认 y): ');
    const shouldSyncPost = askPost.toLowerCase() !== 'n';

    const askTwikoo = await rl.question('? 是否同步 [twikoo_template/] 文件夹？(y/n, 默认 n): ');
    const shouldSyncTwikoo = askTwikoo.toLowerCase() === 'y';

    if (!shouldSyncPost && !shouldSyncTwikoo) {
      console.log('[Info] 未选择任务，流程终止。');
      rl.close();
      return;
    }

    if (fs.existsSync(PATHS.tempVault)) {
      fs.rmSync(PATHS.tempVault, { recursive: true, force: true });
    }

    // 1. 获取远端状态并关闭换行符自动转换
    console.log('[Sync] 正在获取远端状态...');
    try {
      execSync(`git clone --depth 1 -b main ${PRIVATE_REPO_URL} "${PATHS.tempVault}"`, { stdio: 'ignore' });
      execSync(`git config core.autocrlf false`, { cwd: PATHS.tempVault });
      execSync(`git config core.safecrlf false`, { cwd: PATHS.tempVault });
    } catch {
      // 远端为空仓时原地初始化
      fs.mkdirSync(PATHS.tempVault, { recursive: true });
      execSync(`git init`, { cwd: PATHS.tempVault, stdio: 'ignore' });
      execSync(`git config core.autocrlf false`, { cwd: PATHS.tempVault });
      execSync(`git checkout -B main`, { cwd: PATHS.tempVault, stdio: 'ignore' });
      execSync(`git remote add origin ${PRIVATE_REPO_URL}`, { cwd: PATHS.tempVault, stdio: 'ignore' });
    }

    // 2. 清理中转区原有的旧目录，防止本地已删的文件在远端残留
    if (shouldSyncPost && fs.existsSync(path.join(PATHS.tempVault, 'post'))) {
      fs.rmSync(path.join(PATHS.tempVault, 'post'), { recursive: true, force: true });
    }
    if (shouldSyncTwikoo && fs.existsSync(path.join(PATHS.tempVault, 'twikoo_template'))) {
      fs.rmSync(path.join(PATHS.tempVault, 'twikoo_template'), { recursive: true, force: true });
    }

    // 3. 复制最新文件
    if (shouldSyncPost && fs.existsSync(PATHS.posts)) {
      copyFolderSync(PATHS.posts, path.join(PATHS.tempVault, 'post'));
    }
    if (shouldSyncTwikoo && fs.existsSync(PATHS.twikoo)) {
      copyFolderSync(PATHS.twikoo, path.join(PATHS.tempVault, 'twikoo_template'));
    }

    // 4. 精准状态对比
    execSync(`git add .`, { cwd: PATHS.tempVault });
    const status = execSync(`git status --porcelain`, { cwd: PATHS.tempVault }).toString().trim();

    if (!status) {
      console.log('[Skip] 目录内无变动，跳过。');
      fs.rmSync(PATHS.tempVault, { recursive: true, force: true });
      rl.close();
      return;
    }

    // 5. 执行提交与推送
    console.log(`[Sync] 检测到变更，正在推送到远程 main 分支...`);
    const commitMessage = `Vault Backup: ${new Date().toISOString()}`;
    execSync(`git commit -m "${commitMessage}"`, { cwd: PATHS.tempVault, stdio: 'ignore' });
    execSync(`git push -u origin main --force`, { cwd: PATHS.tempVault, stdio: 'inherit' });
    console.log(`[Success] 同步完成。`);

    // 6. 清理中转目录
    fs.rmSync(PATHS.tempVault, { recursive: true, force: true });
    console.log('\n[Done] 流程正常结束。');

  } catch (error) {
    console.error('[Fatal] 异常中止:', error);
    if (fs.existsSync(PATHS.tempVault)) {
      fs.rmSync(PATHS.tempVault, { recursive: true, force: true });
    }
  } finally {
    rl.close();
  }
}

main();