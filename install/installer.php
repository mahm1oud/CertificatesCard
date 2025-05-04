<?php
/**
 * برنامج تثبيت منصة الشهادات والبطاقات الإلكترونية
 * الإصدار 1.0
 */

// منع الوصول المباشر إذا تم التثبيت بالفعل
if (file_exists('../.env') && file_exists('../config.json')) {
    // تحقق من محتوى الملفات للتأكد من أن التثبيت تم بالفعل
    $envContent = file_get_contents('../.env');
    if (strpos($envContent, 'DB_HOST') !== false) {
        header('Location: ../');
        exit('تم التثبيت بالفعل. <a href="../">العودة للصفحة الرئيسية</a>');
    }
}

// دالة لعرض الخطأ
function showError($message) {
    echo '<div class="alert alert-danger" role="alert">' . $message . '</div>';
}

// دالة لعرض النجاح
function showSuccess($message) {
    echo '<div class="alert alert-success" role="alert">' . $message . '</div>';
}

// تحقق من متطلبات التثبيت
function checkRequirements() {
    $requirements = array();
    
    // تحقق من إصدار PHP
    $requirements['php'] = version_compare(PHP_VERSION, '7.4.0', '>=');
    
    // تحقق من وجود امتدادات PHP المطلوبة
    $requirements['pdo_mysql'] = extension_loaded('pdo_mysql');
    $requirements['gd'] = extension_loaded('gd');
    $requirements['fileinfo'] = extension_loaded('fileinfo');
    $requirements['json'] = extension_loaded('json');
    
    // تحقق من صلاحيات الكتابة
    $requirements['writable_root'] = is_writable('../');
    $requirements['writable_uploads'] = is_writable('../uploads') || mkdir('../uploads', 0755, true);
    $requirements['writable_temp'] = is_writable('../temp') || mkdir('../temp', 0755, true);
    
    return $requirements;
}

// تخزين إعدادات قاعدة البيانات في ملف .env
function saveDbConfig($host, $name, $user, $pass) {
    $envContent = "DB_TYPE=mysql\n";
    $envContent .= "DB_HOST=" . $host . "\n";
    $envContent .= "DB_NAME=" . $name . "\n";
    $envContent .= "DB_USER=" . $user . "\n";
    $envContent .= "DB_PASSWORD=" . $pass . "\n";
    $envContent .= "SESSION_SECRET=" . bin2hex(random_bytes(32)) . "\n";
    
    return file_put_contents('../.env', $envContent);
}

// إنشاء قاعدة البيانات وتثبيت الجداول
function setupDatabase($host, $name, $user, $pass) {
    try {
        // الاتصال بالخادم
        $dsn = "mysql:host=$host";
        $pdo = new PDO($dsn, $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // إنشاء قاعدة البيانات إذا لم تكن موجودة
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$name` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        
        // اختيار قاعدة البيانات
        $pdo->exec("USE `$name`");
        
        // تشغيل سكربت إنشاء الجداول
        $sqlFile = file_get_contents('database_schema.sql');
        $pdo->exec($sqlFile);
        
        // إنشاء مستخدم admin افتراضي (كلمة المرور: 700700)
        $adminUser = "admin";
        $adminPass = password_hash("700700", PASSWORD_DEFAULT);
        $adminName = "مدير النظام";
        
        // تحقق من وجود المستخدم قبل الإضافة
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$adminUser]);
        
        if ($stmt->rowCount() == 0) {
            $stmt = $pdo->prepare("INSERT INTO users (username, password, fullName, email, role, isAdmin) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$adminUser, $adminPass, $adminName, "admin@example.com", "admin", 1]);
        }
        
        return true;
    } catch (PDOException $e) {
        return $e->getMessage();
    }
}

// إنشاء ملف .htaccess للتوجيه المناسب
function createHtaccess() {
    $htaccessContent = <<<EOT
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # إذا كان الطلب لملف أو مجلد موجود، قم بتقديمه مباشرة
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    
    # إعادة توجيه طلبات API
    RewriteRule ^api/(.*)$ api.php [L,QSA]
    
    # إعادة توجيه كل الطلبات الأخرى إلى التطبيق الرئيسي
    RewriteRule ^ index.php [L]
</IfModule>

# تعيين وقت انتهاء صلاحية لأنواع الملفات الشائعة
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 year"
</IfModule>

# ضغط الاستجابة
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
EOT;

    return file_put_contents('../.htaccess', $htaccessContent);
}

// إنشاء ملف api.php للتعامل مع طلبات API
function createApiHandler() {
    $apiContent = <<<EOT
<?php
/**
 * معالج طلبات API
 */

// تحميل ملف الإعدادات
require_once 'config.php';

// تحديد نوع المحتوى كـ JSON
header('Content-Type: application/json; charset=utf-8');

// التقاط رابط الطلب
\$path = trim(\$_SERVER['PATH_INFO'] ?? \$_SERVER['REQUEST_URI'], '/');
\$path = preg_replace('#^api/#', '', \$path);

// جلب طريقة الطلب (GET, POST, etc.)
\$method = \$_SERVER['REQUEST_METHOD'];

// استخراج بيانات الطلب
\$input = json_decode(file_get_contents('php://input'), true);
if (is_null(\$input)) {
    \$input = [];
}

// دمج البيانات من POST و GET
\$data = array_merge(\$_GET, \$_POST, \$input);

// سجل طلب API
error_log("API Request: \$method \$path");

// توجيه الطلب إلى المعالج المناسب
switch (\$path) {
    case 'user':
        // مثال للتعامل مع طلب مستخدم
        echo json_encode(['id' => 1, 'username' => 'admin', 'fullName' => 'مدير النظام']);
        break;
        
    case 'templates':
        // مثال للتعامل مع طلب القوالب
        \$db = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASSWORD);
        \$stmt = \$db->query("SELECT * FROM templates WHERE active = 1");
        \$templates = \$stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['templates' => \$templates]);
        break;
        
    default:
        // طلب غير معروف
        http_response_code(404);
        echo json_encode(['error' => 'المسار غير موجود']);
}

// إغلاق اتصال قاعدة البيانات إذا كان مفتوحًا
if (isset(\$db)) {
    \$db = null;
}
EOT;

    return file_put_contents('../api.php', $apiContent);
}

// إنشاء ملف config.php للإعدادات
function createConfigFile() {
    $configContent = <<<EOT
<?php
/**
 * ملف إعدادات التطبيق
 */

// تحميل متغيرات البيئة من ملف .env
\$envFile = __DIR__ . '/.env';
if (file_exists(\$envFile)) {
    \$lines = file(\$envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach (\$lines as \$line) {
        if (strpos(trim(\$line), '#') === 0) {
            continue;
        }
        
        list(\$name, \$value) = explode('=', \$line, 2);
        \$name = trim(\$name);
        \$value = trim(\$value);
        
        if (!\$name) {
            continue;
        }
        
        // تعيين متغيرات البيئة
        putenv(sprintf('%s=%s', \$name, \$value));
        
        // تعيين ثوابت للاستخدام في الكود
        if (\$name === 'DB_HOST') define('DB_HOST', \$value);
        if (\$name === 'DB_NAME') define('DB_NAME', \$value);
        if (\$name === 'DB_USER') define('DB_USER', \$value);
        if (\$name === 'DB_PASSWORD') define('DB_PASSWORD', \$value);
        if (\$name === 'SESSION_SECRET') define('SESSION_SECRET', \$value);
    }
}

// إعدادات التطبيق
define('APP_NAME', 'منصة الشهادات الإلكترونية');
define('APP_URL', (isset(\$_SERVER['HTTPS']) && \$_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . \$_SERVER['HTTP_HOST']);
define('UPLOADS_DIR', __DIR__ . '/uploads');
define('TEMP_DIR', __DIR__ . '/temp');

// تكوين الخطأ
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/error.log');
EOT;

    return file_put_contents('../config.php', $configContent);
}

// التحقق من الإرسال
$step = isset($_POST['step']) ? (int)$_POST['step'] : 1;
$error = '';
$success = '';

// معالجة الخطوة 2 (إعدادات قاعدة البيانات)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $step === 2) {
    $dbHost = $_POST['db_host'] ?? '';
    $dbName = $_POST['db_name'] ?? '';
    $dbUser = $_POST['db_user'] ?? '';
    $dbPass = $_POST['db_password'] ?? '';
    
    if (empty($dbHost) || empty($dbName) || empty($dbUser)) {
        $error = 'يرجى تعبئة جميع حقول قاعدة البيانات المطلوبة';
    } else {
        // محاولة الاتصال بقاعدة البيانات
        $dbResult = setupDatabase($dbHost, $dbName, $dbUser, $dbPass);
        
        if ($dbResult === true) {
            // حفظ إعدادات قاعدة البيانات
            if (saveDbConfig($dbHost, $dbName, $dbUser, $dbPass)) {
                // إنشاء ملفات التكوين
                createHtaccess();
                createApiHandler();
                createConfigFile();
                
                $success = 'تم تثبيت قاعدة البيانات والإعدادات بنجاح!';
                $step = 3; // الانتقال للخطوة التالية
            } else {
                $error = 'حدث خطأ أثناء حفظ إعدادات قاعدة البيانات. تأكد من صلاحيات الكتابة على المجلد.';
            }
        } else {
            $error = 'خطأ في الاتصال بقاعدة البيانات: ' . $dbResult;
        }
    }
}

// معالجة الخطوة 3 (إعدادات الموقع)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $step === 3) {
    $siteName = $_POST['site_name'] ?? 'منصة الشهادات الإلكترونية';
    $adminEmail = $_POST['admin_email'] ?? '';
    
    // حفظ إعدادات الموقع
    $configData = [
        'siteName' => $siteName,
        'adminEmail' => $adminEmail,
        'installDate' => date('Y-m-d H:i:s'),
        'installVersion' => '1.0.0'
    ];
    
    if (file_put_contents('../config.json', json_encode($configData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        $success = 'تم حفظ إعدادات الموقع بنجاح!';
        $step = 4; // الانتقال للخطوة النهائية
    } else {
        $error = 'حدث خطأ أثناء حفظ إعدادات الموقع. تأكد من صلاحيات الكتابة على المجلد.';
    }
}
?>
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تثبيت منصة الشهادات الإلكترونية</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            direction: rtl;
        }
        .installer-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .step-indicator {
            display: flex;
            margin-bottom: 20px;
            justify-content: space-between;
        }
        .step {
            flex: 1;
            padding: 10px;
            text-align: center;
            background-color: #e9ecef;
            margin: 0 5px;
            border-radius: 5px;
        }
        .step.active {
            background-color: #007bff;
            color: white;
        }
        .step.completed {
            background-color: #28a745;
            color: white;
        }
        .logo {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo img {
            max-width: 150px;
        }
        .requirement-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .requirement-item:last-child {
            border-bottom: none;
        }
        .status-icon {
            font-weight: bold;
        }
        .status-success {
            color: #28a745;
        }
        .status-error {
            color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="installer-container">
        <div class="logo">
            <h1>منصة الشهادات والبطاقات الإلكترونية</h1>
            <p class="text-muted">برنامج التثبيت - الإصدار 1.0</p>
        </div>
        
        <div class="step-indicator">
            <div class="step <?php echo $step >= 1 ? 'active' : ''; ?> <?php echo $step > 1 ? 'completed' : ''; ?>">1. التحقق من المتطلبات</div>
            <div class="step <?php echo $step >= 2 ? 'active' : ''; ?> <?php echo $step > 2 ? 'completed' : ''; ?>">2. إعداد قاعدة البيانات</div>
            <div class="step <?php echo $step >= 3 ? 'active' : ''; ?> <?php echo $step > 3 ? 'completed' : ''; ?>">3. إعدادات الموقع</div>
            <div class="step <?php echo $step >= 4 ? 'active' : ''; ?>">4. اكتمال التثبيت</div>
        </div>
        
        <?php if (!empty($error)): ?>
            <?php showError($error); ?>
        <?php endif; ?>
        
        <?php if (!empty($success)): ?>
            <?php showSuccess($success); ?>
        <?php endif; ?>
        
        <!-- الخطوة 1: التحقق من المتطلبات -->
        <?php if ($step == 1): ?>
            <h2>التحقق من متطلبات التثبيت</h2>
            
            <?php
            $requirements = checkRequirements();
            $allPassed = true;
            
            foreach ($requirements as $key => $passed) {
                if (!$passed) {
                    $allPassed = false;
                    break;
                }
            }
            ?>
            
            <div class="card mb-4">
                <div class="card-body">
                    <div class="requirement-item">
                        <span>إصدار PHP (7.4 أو أعلى)</span>
                        <span class="status-icon <?php echo $requirements['php'] ? 'status-success' : 'status-error'; ?>">
                            <?php echo $requirements['php'] ? '✓ ' . PHP_VERSION : '✕ ' . PHP_VERSION; ?>
                        </span>
                    </div>
                    <div class="requirement-item">
                        <span>امتداد PDO MySQL</span>
                        <span class="status-icon <?php echo $requirements['pdo_mysql'] ? 'status-success' : 'status-error'; ?>">
                            <?php echo $requirements['pdo_mysql'] ? '✓ متوفر' : '✕ غير متوفر'; ?>
                        </span>
                    </div>
                    <div class="requirement-item">
                        <span>امتداد GD</span>
                        <span class="status-icon <?php echo $requirements['gd'] ? 'status-success' : 'status-error'; ?>">
                            <?php echo $requirements['gd'] ? '✓ متوفر' : '✕ غير متوفر'; ?>
                        </span>
                    </div>
                    <div class="requirement-item">
                        <span>امتداد Fileinfo</span>
                        <span class="status-icon <?php echo $requirements['fileinfo'] ? 'status-success' : 'status-error'; ?>">
                            <?php echo $requirements['fileinfo'] ? '✓ متوفر' : '✕ غير متوفر'; ?>
                        </span>
                    </div>
                    <div class="requirement-item">
                        <span>امتداد JSON</span>
                        <span class="status-icon <?php echo $requirements['json'] ? 'status-success' : 'status-error'; ?>">
                            <?php echo $requirements['json'] ? '✓ متوفر' : '✕ غير متوفر'; ?>
                        </span>
                    </div>
                    <div class="requirement-item">
                        <span>صلاحيات الكتابة على المجلد الرئيسي</span>
                        <span class="status-icon <?php echo $requirements['writable_root'] ? 'status-success' : 'status-error'; ?>">
                            <?php echo $requirements['writable_root'] ? '✓ متاح' : '✕ غير متاح'; ?>
                        </span>
                    </div>
                    <div class="requirement-item">
                        <span>صلاحيات الكتابة على مجلد uploads</span>
                        <span class="status-icon <?php echo $requirements['writable_uploads'] ? 'status-success' : 'status-error'; ?>">
                            <?php echo $requirements['writable_uploads'] ? '✓ متاح' : '✕ غير متاح'; ?>
                        </span>
                    </div>
                    <div class="requirement-item">
                        <span>صلاحيات الكتابة على مجلد temp</span>
                        <span class="status-icon <?php echo $requirements['writable_temp'] ? 'status-success' : 'status-error'; ?>">
                            <?php echo $requirements['writable_temp'] ? '✓ متاح' : '✕ غير متاح'; ?>
                        </span>
                    </div>
                </div>
            </div>
            
            <form method="post" action="">
                <input type="hidden" name="step" value="2">
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button type="submit" class="btn btn-primary" <?php echo !$allPassed ? 'disabled' : ''; ?>>
                        متابعة إلى إعداد قاعدة البيانات
                    </button>
                </div>
            </form>
            
            <?php if (!$allPassed): ?>
                <div class="alert alert-warning mt-3">
                    <strong>تنبيه:</strong> يرجى معالجة جميع المتطلبات قبل المتابعة.
                </div>
            <?php endif; ?>
            
        <!-- الخطوة 2: إعداد قاعدة البيانات -->
        <?php elseif ($step == 2): ?>
            <h2>إعداد قاعدة البيانات</h2>
            
            <form method="post" action="">
                <input type="hidden" name="step" value="2">
                
                <div class="mb-3">
                    <label for="db_host" class="form-label">خادم قاعدة البيانات:</label>
                    <input type="text" class="form-control" id="db_host" name="db_host" value="localhost" required>
                    <small class="form-text text-muted">عادةً ما يكون "localhost" في الاستضافات المشتركة.</small>
                </div>
                
                <div class="mb-3">
                    <label for="db_name" class="form-label">اسم قاعدة البيانات:</label>
                    <input type="text" class="form-control" id="db_name" name="db_name" required>
                </div>
                
                <div class="mb-3">
                    <label for="db_user" class="form-label">اسم مستخدم قاعدة البيانات:</label>
                    <input type="text" class="form-control" id="db_user" name="db_user" required>
                </div>
                
                <div class="mb-3">
                    <label for="db_password" class="form-label">كلمة مرور قاعدة البيانات:</label>
                    <input type="password" class="form-control" id="db_password" name="db_password">
                </div>
                
                <div class="alert alert-info">
                    <strong>ملاحظة:</strong> سيتم إنشاء مستخدم افتراضي للوحة التحكم بالبيانات التالية:<br>
                    <strong>اسم المستخدم:</strong> admin<br>
                    <strong>كلمة المرور:</strong> 700700
                </div>
                
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button type="submit" class="btn btn-primary">متابعة</button>
                </div>
            </form>
            
        <!-- الخطوة 3: إعدادات الموقع -->
        <?php elseif ($step == 3): ?>
            <h2>إعدادات الموقع</h2>
            
            <form method="post" action="">
                <input type="hidden" name="step" value="3">
                
                <div class="mb-3">
                    <label for="site_name" class="form-label">اسم الموقع:</label>
                    <input type="text" class="form-control" id="site_name" name="site_name" value="منصة الشهادات الإلكترونية" required>
                </div>
                
                <div class="mb-3">
                    <label for="admin_email" class="form-label">البريد الإلكتروني للمدير:</label>
                    <input type="email" class="form-control" id="admin_email" name="admin_email" required>
                </div>
                
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button type="submit" class="btn btn-primary">إكمال التثبيت</button>
                </div>
            </form>
            
        <!-- الخطوة 4: اكتمال التثبيت -->
        <?php elseif ($step == 4): ?>
            <h2>تم اكتمال التثبيت بنجاح!</h2>
            
            <div class="alert alert-success mb-4">
                <h4 class="alert-heading">تهانينا!</h4>
                <p>تم تثبيت منصة الشهادات الإلكترونية بنجاح. يمكنك الآن الوصول إلى لوحة التحكم باستخدام بيانات الدخول التالية:</p>
                <hr>
                <p class="mb-0">
                    <strong>اسم المستخدم:</strong> admin<br>
                    <strong>كلمة المرور:</strong> 700700
                </p>
            </div>
            
            <div class="card mb-4">
                <div class="card-header">
                    الخطوات التالية
                </div>
                <div class="card-body">
                    <ol>
                        <li>قم بتسجيل الدخول إلى لوحة التحكم واستكشاف الميزات المتاحة.</li>
                        <li>قم بتغيير كلمة المرور الافتراضية من خلال صفحة الملف الشخصي.</li>
                        <li>قم بإعداد الإعدادات العامة للموقع من خلال لوحة التحكم.</li>
                        <li>ابدأ بإضافة القوالب والتصميمات الخاصة بك.</li>
                    </ol>
                </div>
            </div>
            
            <div class="alert alert-warning">
                <strong>هام جداً:</strong> لأسباب أمنية، يرجى حذف مجلد التثبيت <code>/install</code> بعد اكتمال عملية التثبيت.
            </div>
            
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <a href="../" class="btn btn-success">الذهاب إلى الموقع</a>
            </div>
        <?php endif; ?>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>