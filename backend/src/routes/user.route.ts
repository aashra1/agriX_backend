import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();


router.post('/register', userController.register);
router.post('/login', userController.loginUser);

router.get('/', userController.getAllUsers);
router.get('/:userId', userController.getUserProfile);
router.put('/:userId', userController.editUserProfile);
router.delete('/:userId', userController.deleteUserAccount);

export default router;