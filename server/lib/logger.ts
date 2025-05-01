/**
 * وحدة تسجيل بسيطة للخادم
 */

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function error(message: string, err?: any, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit", 
    hour12: true,
  });

  console.error(`${formattedTime} [${source}] ERROR: ${message}`);
  if (err) {
    console.error(err);
  }
}

export function warn(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.warn(`${formattedTime} [${source}] WARNING: ${message}`);
}

export function info(message: string, source = "express") {
  log(message, source);
}

export default {
  log,
  error,
  warn,
  info
};