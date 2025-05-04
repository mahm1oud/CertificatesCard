/**
 * أداة تحويل قاعدة البيانات من PostgreSQL إلى MySQL
 * 
 * هذه الأداة تقوم بتحويل بيانات التطبيق من قاعدة بيانات PostgreSQL إلى MySQL
 * خصيصًا للاستخدام عند نشر التطبيق على استضافة Hostinger أو أي استضافة تستخدم MySQL
 * 
 * الخطوات المتبعة:
 * 1. قراءة البيانات من PostgreSQL
 * 2. تحويل البيانات إلى تنسيق متوافق مع MySQL
 * 3. إنشاء جداول MySQL المطلوبة
 * 4. نقل البيانات إلى MySQL
 */

const { Client } = require('pg');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');

// قراءة ملف البيئة إذا كان موجودًا
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

/**
 * تكوين الاتصال بقاعدة البيانات PostgreSQL
 */
const pgConfig = {
  host: process.env.PG_HOST || process.env.PGHOST || 'localhost',
  port: process.env.PG_PORT || process.env.PGPORT || 5432,
  database: process.env.PG_DATABASE || process.env.PGDATABASE || 'certificates',
  user: process.env.PG_USER || process.env.PGUSER || 'postgres',
  password: process.env.PG_PASSWORD || process.env.PGPASSWORD || '',
};

/**
 * تكوين الاتصال بقاعدة البيانات MySQL
 */
const mysqlConfig = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'certificates',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
};

/**
 * تاريخ بدء التحويل لترقيم الملفات المؤقتة
 */
const timestamp = new Date().toISOString().replace(/[:.]/g, '_');

/**
 * قائمة الجداول التي سيتم تحويلها
 */
const tables = [
  { name: 'users', primaryKey: 'id' },
  { name: 'categories', primaryKey: 'id' },
  { name: 'templates', primaryKey: 'id' },
  { name: 'template_fields', primaryKey: 'id' },
  { name: 'cards', primaryKey: 'id' },
  { name: 'certificates', primaryKey: 'id' },
  { name: 'settings', primaryKey: 'id' },
  { name: 'display_settings', primaryKey: 'id' },
  { name: 'user_preferences', primaryKey: 'id' },
  { name: 'session', primaryKey: 'sid' }
];

/**
 * التعديلات اللازمة لكل نوع حقل عند التحويل من PostgreSQL إلى MySQL
 */
const dataTypeTransformations = {
  'timestamp': (value) => value ? value.toISOString().slice(0, 19).replace('T', ' ') : null,
  'timestamptz': (value) => value ? value.toISOString().slice(0, 19).replace('T', ' ') : null,
  'json': (value) => typeof value === 'object' ? JSON.stringify(value) : value,
  'jsonb': (value) => typeof value === 'object' ? JSON.stringify(value) : value,
  'boolean': (value) => value === true ? 1 : (value === false ? 0 : null),
  'text': (value) => value,
  'varchar': (value) => value,
  'int4': (value) => value,
  'serial': (value) => value,
  'integer': (value) => value,
  'bigint': (value) => value,
  'bigserial': (value) => value,
  'float8': (value) => value,
  'numeric': (value) => value,
};

/**
 * تحويل أنواع الحقول من PostgreSQL إلى MySQL
 */
const pgToMysqlTypeMap = {
  'serial': 'INT AUTO_INCREMENT',
  'bigserial': 'BIGINT AUTO_INCREMENT',
  'int4': 'INT',
  'integer': 'INT',
  'bigint': 'BIGINT',
  'float8': 'DOUBLE',
  'numeric': 'DECIMAL(16,4)',
  'text': 'TEXT',
  'varchar': 'VARCHAR(255)',
  'character varying': 'VARCHAR(255)',
  'timestamp': 'DATETIME',
  'timestamptz': 'DATETIME',
  'json': 'JSON',
  'jsonb': 'JSON',
  'boolean': 'TINYINT(1)'
};

/**
 * استخراج اسم الجدول من SQL
 */
function extractTableName(createTableSQL) {
  const match = createTableSQL.match(/CREATE TABLE.*?(\w+)/i);
  return match ? match[1] : null;
}

/**
 * تحويل استعلام إنشاء جدول من PostgreSQL إلى MySQL
 */
function transformCreateTableSQL(createTableSQL) {
  let mysqlSQL = createTableSQL
    // إزالة IF NOT EXISTS لتجنب المشاكل
    .replace(/IF NOT EXISTS/i, '')
    // تحويل أنواع البيانات
    .replace(/serial/ig, 'INT AUTO_INCREMENT')
    .replace(/bigserial/ig, 'BIGINT AUTO_INCREMENT')
    .replace(/int4/ig, 'INT')
    .replace(/integer/ig, 'INT')
    .replace(/bigint/ig, 'BIGINT')
    .replace(/float8/ig, 'DOUBLE')
    .replace(/numeric/ig, 'DECIMAL(16,4)')
    .replace(/text/ig, 'TEXT')
    .replace(/character varying(\(\d+\))?/ig, 'VARCHAR(255)')
    .replace(/varchar/ig, 'VARCHAR')
    .replace(/timestamp (?:with(?:out)? time zone)?/ig, 'DATETIME')
    .replace(/timestamptz/ig, 'DATETIME')
    .replace(/json/ig, 'JSON')
    .replace(/jsonb/ig, 'JSON')
    .replace(/boolean/ig, 'TINYINT(1)')
    // إزالة الخصائص غير المتوافقة
    .replace(/DEFAULT now\(\)/ig, 'DEFAULT CURRENT_TIMESTAMP')
    .replace(/REFERENCES.*?(,|$)/ig, '$1')
    .replace(/CONSTRAINT.*?(,|$)/ig, '$1')
    .replace(/UNIQUE.*?(,|$)/ig, '$1')
    // تنظيف الفواصل الزائدة
    .replace(/,\s*\)/g, '\n)')
    // إضافة محرك InnoDB
    .replace(/\);$/, ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  
  return mysqlSQL;
}

/**
 * قراءة هيكل الجداول من PostgreSQL
 */
async function getPostgresTableStructures(pgClient) {
  const tableStructures = {};
  
  for (const table of tables) {
    const tableQueryResult = await pgClient.query(`
      SELECT 
        column_name, 
        data_type,
        column_default,
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position;
    `, [table.name]);
    
    tableStructures[table.name] = {
      columns: tableQueryResult.rows,
      primaryKey: table.primaryKey
    };
  }
  
  return tableStructures;
}

/**
 * إنشاء استعلامات إنشاء الجداول في MySQL
 */
function generateMySQLCreateTableQueries(tableStructures) {
  const createTableQueries = {};
  
  for (const [tableName, tableInfo] of Object.entries(tableStructures)) {
    let query = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    const columnDefinitions = tableInfo.columns.map(column => {
      const columnName = column.column_name;
      let dataType = pgToMysqlTypeMap[column.data_type] || 'VARCHAR(255)';
      const isNullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      let defaultValue = '';
      
      // معالجة القيم الافتراضية
      if (column.column_default) {
        if (column.column_default.includes('nextval')) {
          // الحقول التي تزيد تلقائيًا
          if (!columnName.toLowerCase().includes('id')) {
            defaultValue = '';
          }
        } else if (column.column_default === 'now()') {
          defaultValue = 'DEFAULT CURRENT_TIMESTAMP';
        } else if (column.column_default === 'true') {
          defaultValue = 'DEFAULT 1';
        } else if (column.column_default === 'false') {
          defaultValue = 'DEFAULT 0';
        } else if (column.column_default.startsWith("'") && column.column_default.endsWith("'")) {
          defaultValue = `DEFAULT ${column.column_default}`;
        } else if (!isNaN(Number(column.column_default))) {
          defaultValue = `DEFAULT ${column.column_default}`;
        }
      }
      
      return `  ${columnName} ${dataType} ${isNullable} ${defaultValue}`.trim();
    });
    
    // إضافة المفتاح الأساسي
    const primaryKeyDef = `  PRIMARY KEY (${tableInfo.primaryKey})`;
    columnDefinitions.push(primaryKeyDef);
    
    query += columnDefinitions.join(',\n');
    query += '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
    
    createTableQueries[tableName] = query;
  }
  
  return createTableQueries;
}

/**
 * استخراج بيانات الجداول من PostgreSQL
 */
async function extractDataFromPostgres(pgClient, tableStructures) {
  const tableData = {};
  
  for (const [tableName, tableInfo] of Object.entries(tableStructures)) {
    console.log(`استخراج البيانات من جدول ${tableName}...`);
    
    const result = await pgClient.query(`SELECT * FROM ${tableName}`);
    tableData[tableName] = {
      columns: tableInfo.columns,
      rows: result.rows
    };
    
    console.log(`  تم استخراج ${result.rows.length} صف من جدول ${tableName}`);
  }
  
  return tableData;
}

/**
 * تحويل البيانات لتتوافق مع MySQL
 */
function transformDataForMySQL(tableData) {
  const transformedData = {};
  
  for (const [tableName, data] of Object.entries(tableData)) {
    console.log(`تحويل بيانات جدول ${tableName}...`);
    
    transformedData[tableName] = {
      columns: data.columns,
      rows: data.rows.map(row => {
        const transformedRow = {};
        
        for (const [key, value] of Object.entries(row)) {
          if (value === null) {
            transformedRow[key] = null;
            continue;
          }
          
          // تحديد نوع البيانات للحقل
          const column = data.columns.find(col => col.column_name === key);
          if (!column) {
            transformedRow[key] = value;
            continue;
          }
          
          const dataType = column.data_type;
          const transformer = dataTypeTransformations[dataType] || (val => val);
          
          try {
            transformedRow[key] = transformer(value);
          } catch (error) {
            console.error(`خطأ في تحويل قيمة للحقل ${key} في جدول ${tableName}:`, error);
            transformedRow[key] = null;
          }
        }
        
        return transformedRow;
      })
    };
  }
  
  return transformedData;
}

/**
 * إدخال البيانات في MySQL
 */
async function insertDataIntoMySQL(mysqlConnection, transformedData) {
  for (const [tableName, data] of Object.entries(transformedData)) {
    const rows = data.rows;
    
    if (rows.length === 0) {
      console.log(`جدول ${tableName} لا يحتوي على بيانات للنقل.`);
      continue;
    }
    
    console.log(`إدخال ${rows.length} صف في جدول ${tableName}...`);
    
    // إنشاء قائمة بأسماء الأعمدة
    const columns = Object.keys(rows[0]);
    
    // إنشاء علامات الاستفهام للقيم
    const placeholders = columns.map(() => '?').join(', ');
    
    // إنشاء استعلام الإدخال
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    // إدخال البيانات على دفعات لتجنب تجاوز الحد الأقصى للاتصال
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      console.log(`  إدخال دفعة ${i / batchSize + 1} من ${Math.ceil(rows.length / batchSize)} (${batch.length} صف)...`);
      
      for (const row of batch) {
        try {
          const values = columns.map(col => row[col]);
          await mysqlConnection.execute(query, values);
        } catch (error) {
          console.error(`خطأ في إدخال صف في جدول ${tableName}:`, error);
          console.error('الصف المسبب للمشكلة:', row);
        }
      }
    }
  }
}

/**
 * الوظيفة الرئيسية لتنفيذ عملية التحويل
 */
async function convertPostgresToMySQL() {
  console.log('🚀 بدء عملية تحويل قاعدة البيانات من PostgreSQL إلى MySQL...');
  
  // طلب تأكيد من المستخدم
  console.log('\n⚠️ تحذير: هذه العملية ستحذف أي بيانات موجودة في قاعدة بيانات MySQL المستهدفة!');
  console.log('إعدادات الاتصال:');
  console.log('- PostgreSQL:', `${pgConfig.user}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`);
  console.log('- MySQL:', `${mysqlConfig.user}@${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);
  
  const confirm = await question('\nهل تريد المتابعة؟ (نعم/لا): ');
  
  if (confirm.toLowerCase() !== 'نعم' && confirm.toLowerCase() !== 'y') {
    console.log('تم إلغاء العملية.');
    rl.close();
    return;
  }
  
  let pgClient = null;
  let mysqlConnection = null;
  
  try {
    // الاتصال بقاعدة بيانات PostgreSQL
    console.log('\n1️⃣ جاري الاتصال بقاعدة بيانات PostgreSQL...');
    pgClient = new Client(pgConfig);
    await pgClient.connect();
    console.log('✅ تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.');
    
    // استخراج هيكل الجداول
    console.log('\n2️⃣ جاري استخراج هيكل الجداول...');
    const tableStructures = await getPostgresTableStructures(pgClient);
    console.log(`✅ تم استخراج هيكل ${Object.keys(tableStructures).length} جدول.`);
    
    // استخراج البيانات
    console.log('\n3️⃣ جاري استخراج البيانات من PostgreSQL...');
    const tableData = await extractDataFromPostgres(pgClient, tableStructures);
    console.log('✅ تم استخراج البيانات بنجاح.');
    
    // تحويل البيانات
    console.log('\n4️⃣ جاري تحويل البيانات لتتوافق مع MySQL...');
    const transformedData = transformDataForMySQL(tableData);
    console.log('✅ تم تحويل البيانات بنجاح.');
    
    // إنشاء استعلامات إنشاء الجداول في MySQL
    console.log('\n5️⃣ جاري إنشاء استعلامات إنشاء الجداول في MySQL...');
    const createTableQueries = generateMySQLCreateTableQueries(tableStructures);
    console.log(`✅ تم إنشاء ${Object.keys(createTableQueries).length} استعلام إنشاء جدول.`);
    
    // حفظ استعلامات إنشاء الجداول في ملف نصي للاستخدام المستقبلي
    const sqlDir = path.join(__dirname, '../mysql');
    await fs.mkdir(sqlDir, { recursive: true });
    
    const schemaFilePath = path.join(sqlDir, 'schema.sql');
    await fs.writeFile(schemaFilePath, Object.values(createTableQueries).join('\n\n'));
    console.log(`✅ تم حفظ استعلامات إنشاء الجداول في ${schemaFilePath}`);
    
    // الاتصال بقاعدة بيانات MySQL
    console.log('\n6️⃣ جاري الاتصال بقاعدة بيانات MySQL...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ تم الاتصال بقاعدة بيانات MySQL بنجاح.');
    
    // إنشاء الجداول في MySQL
    console.log('\n7️⃣ جاري إنشاء الجداول في MySQL...');
    for (const [tableName, query] of Object.entries(createTableQueries)) {
      try {
        await mysqlConnection.execute(query);
        console.log(`  ✅ تم إنشاء جدول ${tableName} بنجاح.`);
      } catch (error) {
        console.error(`  ❌ خطأ في إنشاء جدول ${tableName}:`, error.message);
        if (error.message.includes('already exists')) {
          const dropConfirm = await question(`  هل تريد حذف جدول ${tableName} الموجود وإعادة إنشائه؟ (نعم/لا): `);
          if (dropConfirm.toLowerCase() === 'نعم' || dropConfirm.toLowerCase() === 'y') {
            await mysqlConnection.execute(`DROP TABLE ${tableName}`);
            await mysqlConnection.execute(query);
            console.log(`  ✅ تم إعادة إنشاء جدول ${tableName} بنجاح.`);
          } else {
            console.log(`  ⚠️ تم تخطي جدول ${tableName}.`);
          }
        }
      }
    }
    
    // إدخال البيانات في MySQL
    console.log('\n8️⃣ جاري إدخال البيانات في MySQL...');
    await insertDataIntoMySQL(mysqlConnection, transformedData);
    console.log('✅ تم إدخال البيانات بنجاح.');
    
    // إنشاء ملف نصي للنسخ الاحتياطي من البيانات
    console.log('\n9️⃣ جاري إنشاء ملف نصي للنسخ الاحتياطي من البيانات...');
    const seedFilePath = path.join(sqlDir, 'seed.sql');
    
    // توليد استعلامات الإدخال
    let seedFileContent = '';
    for (const [tableName, data] of Object.entries(transformedData)) {
      const rows = data.rows;
      if (rows.length === 0) continue;
      
      seedFileContent += `-- إدخال البيانات في جدول ${tableName}\n`;
      
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map(col => {
          const value = row[col];
          if (value === null) return 'NULL';
          
          if (typeof value === 'string') {
            // التعامل مع الاقتباسات في النصوص
            return `'${value.replace(/'/g, "''")}'`;
          } else if (typeof value === 'boolean') {
            return value ? '1' : '0';
          } else {
            return value;
          }
        });
        
        seedFileContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      
      seedFileContent += '\n';
    }
    
    await fs.writeFile(seedFilePath, seedFileContent);
    console.log(`✅ تم حفظ استعلامات إدخال البيانات في ${seedFilePath}`);
    
    console.log('\n🎉 تمت عملية التحويل بنجاح!');
    console.log(`📁 ملفات SQL المنشأة:`);
    console.log(`  - مخطط قاعدة البيانات: ${schemaFilePath}`);
    console.log(`  - بيانات قاعدة البيانات: ${seedFilePath}`);
    
  } catch (error) {
    console.error('❌ حدث خطأ أثناء عملية التحويل:', error);
  } finally {
    // إغلاق الاتصالات
    if (pgClient) {
      console.log('\nإغلاق الاتصال بقاعدة بيانات PostgreSQL...');
      await pgClient.end();
    }
    
    if (mysqlConnection) {
      console.log('إغلاق الاتصال بقاعدة بيانات MySQL...');
      await mysqlConnection.end();
    }
    
    rl.close();
  }
}

// تنفيذ العملية
if (require.main === module) {
  convertPostgresToMySQL().catch(error => {
    console.error('حدث خطأ غير متوقع:', error);
    process.exit(1);
  });
}

module.exports = { convertPostgresToMySQL };