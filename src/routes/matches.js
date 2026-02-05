import {Router} from 'express';

export const router = Router();

router.get('/', (req, res) => {
   res.status(200).json({ message: 'Matches list!' });
});