import express from 'express';
import { chatsRouter } from './modules/chats/presentation/chats.routes';
import { documentsRouter } from './modules/documents/presentation/documents.routes';
import { healthRouter } from './modules/health/presentation/health.routes';
import { languagesRouter } from './modules/languages/presentation/languages.routes';
import { permissionsRouter } from './modules/permissions/presentation/permissions.routes';
import { perspectivesRouter } from './modules/perspectives/presentation/perspectives.routes';
import { promptsRouter } from './modules/prompts/presentation/prompts.routes';
import { tagsRouter } from './modules/tags/presentation/tags.routes';
import { usersRouter } from './modules/users/presentation/users.routes';
import { workspacesRouter } from './modules/workspaces/presentation/workspaces.routes';

const router = express.Router();

router.use(chatsRouter);
router.use(documentsRouter);
router.use(healthRouter);
router.use(languagesRouter);
router.use(permissionsRouter);
router.use(perspectivesRouter);
router.use(promptsRouter);
router.use(tagsRouter);
router.use(usersRouter);
router.use(workspacesRouter);

// router.use("/language", authenticateCookie, languageRouter);
// router.use("/permissions", authenticateCookie, permissionsRouter);
// router.use("/perspectives", authenticateCookie, perspectivesRouter);
// router.use("/prompts", authenticateCookie, promptsRouter);
// router.use("/tags", authenticateCookie, tagsRouter);
// router.use("/users", usersRouter);
// router.use("/workspaces", authenticateCookie, workspacesRouter);

export default router;
