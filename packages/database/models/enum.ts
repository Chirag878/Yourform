import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["Creator", "User"]);

export const formStatusEnum = pgEnum("form_status", ["Draft", "Published","Closed"]);

export const  formVisibilityEnum = pgEnum("visibility", ["Public", "Private"]);

export const submissionAuthModeEnum = pgEnum("response_auth_mode", ["PUBLIC", "AUTHENTICATED"]);

export const formGenreEnum = pgEnum("genre", ["FEEDBACK", "SURVEY", "EVENTS", "JOB","CUSTOM" ]);

export const submissionStatusEnum = pgEnum("submission_status", ["In_PROGRESS", "COMPLETED", "PARTIAL", "ABANDONED"]);

