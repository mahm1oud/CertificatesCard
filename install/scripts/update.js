#!/usr/bin/env node

/**
 * سكريبت تحديث التطبيق
 * هذا السكريبت يقوم بتحديث التطبيق إلى أحدث إصدار
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// واجهة لقراءة المدخلات
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// طرح سؤال والانتظار للإجابة
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// تنفيذ أمر وطباعة النتيجة
function execute(command, silent = false) {
  try {
    if (!silent) {
      console.log(`${colors.dim}$ ${command}${colors.reset}`);
    }
    const output = execSync(command, { encoding: 'utf8' });
    if (!silent && output.trim()) {
      console.log(output.trim());
    }
    return { success: true, output };
  } catch (error) {
    if (!silent) {
      console.error(`${colors.red}Error executing command: ${command}${colors.reset}`);
      console.error(`${colors.red}${error.message}${colors.reset}`);
    }
    return { success: false, error };
  }
}

// التحقق من وجود ملف
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// الحصول على معلومات الإصدار
function getVersionInfo() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fileExists(packagePath)) {
    return { current: 'unknown', latest: 'unknown' };
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version || 'unknown';
    
    // محاولة الحصول على أحدث إصدار من المستودع
    const repoUrl = packageJson.repository?.url || '';
    let latestVersion = currentVersion;
    
    if (repoUrl) {
      try {
        const gitInfoResult = execute(`git ls-remote --tags ${repoUrl}`, true);
        if (gitInfoResult.success) {
          const tags = gitInfoResult.output.split('\n')
            .filter(line => line.includes('refs/tags/v'))
            .map(line => line.split('refs/tags/v')[1])
            .filter(tag => /^\d+\.\d+\.\d+$/.test(tag))
            .sort((a, b) => {
              const aParts = a.split('.').map(Number);
              const bParts = b.split('.').map(Number);
              return (bParts[0] - aParts[0]) || (bParts[1] - aParts[1]) || (bParts[2] - aParts[2]);
            });
          
          if (tags.length > 0) {
            latestVersion = tags[0];
          }
        }
      } catch (error) {
        // تجاهل الأخطاء عند محاولة الوصول إلى المستودع
      }
    }
    
    return {
      current: currentVersion,
      latest: latestVersion
    };
  } catch (error) {
    console.error(`${colors.red}Error reading package.json: ${error.message}${colors.reset}`);
    return { current: 'unknown', latest: 'unknown' };
  }
}

// إنشاء نسخة احتياطية قبل التحديث
async function createBackup() {
  console.log(`\n${colors.cyan}Creating backup before update...${colors.reset}`);
  
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fileExists(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupScript = path.join(process.cwd(), 'install', 'scripts', 'backup.js');
  
  if (fileExists(backupScript)) {
    const backupResult = execute(`node ${backupScript} backup pre-update-${timestamp}`);
    return backupResult.success;
  } else {
    console.log(`${colors.yellow}Backup script not found. Creating simple backup...${colors.reset}`);
    
    // نسخ احتياطي بسيط لملفات التكوين الرئيسية
    const configFiles = ['.env', 'config.json', 'ecosystem.config.js'];
    const backupFolder = path.join(backupDir, `simple-backup-${timestamp}`);
    fs.mkdirSync(backupFolder, { recursive: true });
    
    let success = true;
    for (const file of configFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fileExists(filePath)) {
        try {
          fs.copyFileSync(filePath, path.join(backupFolder, file));
          console.log(`${colors.green}✓ Backed up ${file}${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}✗ Failed to backup ${file}: ${error.message}${colors.reset}`);
          success = false;
        }
      }
    }
    
    return success;
  }
}

// تحديث التبعيات
function updateDependencies() {
  console.log(`\n${colors.cyan}Updating dependencies...${colors.reset}`);
  return execute('npm install').success;
}

// بناء التطبيق
function buildApplication() {
  console.log(`\n${colors.cyan}Building application...${colors.reset}`);
  return execute('npm run build').success;
}

// تحديث بنية قاعدة البيانات
function updateDatabaseSchema() {
  console.log(`\n${colors.cyan}Updating database schema...${colors.reset}`);
  
  // البحث عن سكريبتات تحديث قاعدة البيانات
  const dbUpdateScript = path.join(process.cwd(), 'install', 'scripts', 'db-update.js');
  const drizzlePushScript = path.join(process.cwd(), 'node_modules', '.bin', 'drizzle-kit push');
  
  if (fileExists(dbUpdateScript)) {
    return execute(`node ${dbUpdateScript}`).success;
  } else if (fileExists(path.join(process.cwd(), 'drizzle.config.ts'))) {
    return execute('npm run db:push').success;
  } else {
    console.log(`${colors.yellow}No database update script found. Skipping database schema update.${colors.reset}`);
    return true;
  }
}

// إعادة تشغيل التطبيق
function restartApplication() {
  console.log(`\n${colors.cyan}Restarting application...${colors.reset}`);
  
  // التحقق من وجود PM2
  const isPm2Installed = execute('pm2 -v', true).success;
  
  if (isPm2Installed) {
    const pm2ConfigFile = path.join(process.cwd(), 'ecosystem.config.js');
    
    if (fileExists(pm2ConfigFile)) {
      return execute('pm2 reload ecosystem.config.js').success;
    } else {
      return execute('pm2 restart certificate-app').success;
    }
  } else {
    console.log(`${colors.yellow}PM2 not detected. Application must be restarted manually.${colors.reset}`);
    return true;
  }
}

// البرنامج الرئيسي
async function main() {
  console.log(`\n${colors.bright}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}     تحديث نظام الشهادات والبطاقات      ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}\n`);
  
  // التحقق من الإصدار
  const { current, latest } = getVersionInfo();
  console.log(`${colors.bright}Current version: ${colors.green}${current}${colors.reset}`);
  console.log(`${colors.bright}Latest version: ${colors.green}${latest}${colors.reset}\n`);
  
  // سؤال المستخدم للتأكيد
  const confirm = await ask(`${colors.yellow}Do you want to update the application? (y/n): ${colors.reset}`);
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log(`\n${colors.yellow}Update canceled.${colors.reset}`);
    rl.close();
    return;
  }
  
  console.log(`\n${colors.bright}${colors.cyan}Starting update process...${colors.reset}`);
  
  // إنشاء نسخة احتياطية
  const backupSuccess = await createBackup();
  if (!backupSuccess) {
    const continueAnyway = await ask(`${colors.red}Backup failed. Continue with update anyway? (y/n): ${colors.reset}`);
    if (continueAnyway.toLowerCase() !== 'y' && continueAnyway.toLowerCase() !== 'yes') {
      console.log(`\n${colors.yellow}Update canceled.${colors.reset}`);
      rl.close();
      return;
    }
  }
  
  // تحديث التبعيات
  const dependenciesUpdated = updateDependencies();
  if (!dependenciesUpdated) {
    const continueAnyway = await ask(`${colors.red}Dependency update failed. Continue anyway? (y/n): ${colors.reset}`);
    if (continueAnyway.toLowerCase() !== 'y' && continueAnyway.toLowerCase() !== 'yes') {
      console.log(`\n${colors.yellow}Update canceled.${colors.reset}`);
      rl.close();
      return;
    }
  }
  
  // بناء التطبيق
  const buildSucceeded = buildApplication();
  if (!buildSucceeded) {
    const continueAnyway = await ask(`${colors.red}Build failed. Continue anyway? (y/n): ${colors.reset}`);
    if (continueAnyway.toLowerCase() !== 'y' && continueAnyway.toLowerCase() !== 'yes') {
      console.log(`\n${colors.yellow}Update canceled.${colors.reset}`);
      rl.close();
      return;
    }
  }
  
  // تحديث بنية قاعدة البيانات
  const dbUpdateSucceeded = updateDatabaseSchema();
  if (!dbUpdateSucceeded) {
    const continueAnyway = await ask(`${colors.red}Database update failed. Continue anyway? (y/n): ${colors.reset}`);
    if (continueAnyway.toLowerCase() !== 'y' && continueAnyway.toLowerCase() !== 'yes') {
      console.log(`\n${colors.yellow}Update canceled.${colors.reset}`);
      rl.close();
      return;
    }
  }
  
  // إعادة تشغيل التطبيق
  const restartSucceeded = restartApplication();
  
  console.log(`\n${colors.bright}${colors.green}========================================${colors.reset}`);
  if (dependenciesUpdated && buildSucceeded && dbUpdateSucceeded && restartSucceeded) {
    console.log(`${colors.bright}${colors.green}        تم تحديث التطبيق بنجاح!         ${colors.reset}`);
  } else {
    console.log(`${colors.bright}${colors.yellow}     تم تحديث التطبيق مع بعض التحذيرات      ${colors.reset}`);
    console.log(`${colors.bright}${colors.yellow}   يرجى مراجعة السجلات للمزيد من التفاصيل   ${colors.reset}`);
  }
  console.log(`${colors.bright}${colors.green}========================================${colors.reset}\n`);
  
  rl.close();
}

main().catch(error => {
  console.error(`${colors.red}An unexpected error occurred: ${error.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});