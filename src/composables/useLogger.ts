import { LogLevel, type Log } from "@/types";
import type { Logger } from "@confio/relayer";
import { ref } from "vue";

export function useLogger() {
	const log = ref([] as Log);

	const logger = {} as Logger;

	logger.info = (message: string, meta?: Record<string, unknown>) => {
		log.value.push({
			timestamp: (new Date()).toISOString(),
			level: LogLevel.INFO,
			entry: message,
			meta
		});
		return logger;
	}

	logger.warn = (message: string, meta?: Record<string, unknown>) => {
		log.value.push({
			timestamp: (new Date()).toISOString(),
			level: LogLevel.WARN,
			entry: message,
			meta
		});
		return logger;
	}
	
	logger.error = (message: string, meta?: Record<string, unknown>) => {
		log.value.push({
			timestamp: (new Date()).toISOString(),
			level: LogLevel.ERROR,
			entry: message,
			meta
		});
		return logger;
	}
	
	logger.verbose = (message: string, meta?: Record<string, unknown>) => {
		log.value.push({
			timestamp: (new Date()).toISOString(),
			level: LogLevel.VERBOSE,
			entry: message,
			meta
		});
		return logger;
	}
	
	logger.debug = (message: string, meta?: Record<string, unknown>) => {
		log.value.push({
			timestamp: new Date().toISOString(),
			level: LogLevel.DEBUG,
			entry: message,
			meta
		})
		return logger
	}
	return { log, logger };
}