import { Router } from 'express';

import auth from './auth';
import userInfo from './userInfo';
import users from './users';

const router = Router();

router.use('/auth', auth);
router.use('/user-info', userInfo);
router.use('/users', users);

export default router;
