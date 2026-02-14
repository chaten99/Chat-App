import { Router } from "express";
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUserForSidebar, markMessageAsSeen, sendMessage, deleteMessage, deleteChat,editMessage, reactToMessage } from "../controllers/messageController.js";
const messageRouter = Router();

messageRouter.get('/users', protectRoute, getUserForSidebar);
messageRouter.get('/:id', protectRoute, getMessages);
messageRouter.put('/marks/:id', protectRoute, markMessageAsSeen);
messageRouter.post('/send/:id', protectRoute, sendMessage);
messageRouter.delete('/:id', protectRoute, deleteMessage);
messageRouter.delete("/chat/:id", protectRoute, deleteChat);

messageRouter.put('/edit/:id', protectRoute, editMessage);
messageRouter.post('/react/:id', protectRoute, reactToMessage);




export default messageRouter;