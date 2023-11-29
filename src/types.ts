
export enum LogLevel {
	LOG = 0,
	INFO = 1,
	ERROR = 2,
	WARN = 3,
	VERBOSE = 4,
	DEBUG = 5
};
export type LogEntry = {
	timestamp: string;
	level: LogLevel;
	entry: string;
	meta?: Record<string, unknown>;
}
export type Log = Array<LogEntry>