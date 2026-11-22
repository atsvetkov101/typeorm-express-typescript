import { Router } from 'express';

import { userInfo } from 'controllers/users';
import { checkJwt } from 'middleware/checkJwt';

const router = Router();

router.get('/', [checkJwt], userInfo);

export default router;
