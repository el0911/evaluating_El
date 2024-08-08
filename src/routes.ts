import express from 'express';
import { flowQueue } from '../lib/queue';
import { prisma } from '../lib/prisma'
import { validateActions } from './utils';
const router = express.Router();
// Create a new flow
router.post('/flows', async (req, res) => {
    try {
      const { triggerEvent, actions } = req.body;
  
      // Validate request body
      if (!triggerEvent) {
        return res.status(400).json({ message: 'triggerEvent is required' });
      }
  
      // Check if a flow with the same triggerEvent already exists
      const existingFlow = await prisma.flow.findUnique({
        where: { triggerEvent },
      });
  
   
      ///check for duplicate flow
      if (existingFlow) {
        return res.status(409).json({ message: 'Flow with this triggerEvent already exists' });
      }
  
      
      const errors  = validateActions(actions) as string[];
      if (errors.length > 0) {
        return res.status(400).json({ message: `Action validation failed: ${errors.join(', ')}` });
      }
  
      // Create the new flow
      const newFlow = await prisma.flow.create({
        data: {
          triggerEvent,
          actions: {
            create: actions.map((action: { type: any; emailSubject: any; emailBody: any; delayMinutes: any; order: any; }) => ({
              type: action.type,
              emailSubject: action.emailSubject ?? null,  // Use null if emailSubject is not provided
              emailBody: action.emailBody ?? null,        // Use null if emailBody is not provided
              delayMinutes: action.delayMinutes ?? null,  // Use null if delayMinutes is not provided
              order: action.order,
            })),
          },
        },
        include: { actions: true },  // Include actions in the response
      });
  
  
      res.status(201).json(newFlow);
    } catch (error) {
      console.error('Error creating flow:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  
  // Edit an existing flow
  router.put('/flows/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { triggerEvent, actions } = req.body;
  
      // Validate request body
      if (!triggerEvent) {
        return res.status(400).json({ message: 'triggerEvent is required' });
      }
  
      // Validate actions
      const errors = validateActions(actions) as string[];
      if (errors.length > 0) {
        return res.status(400).json({ message: `Action validation failed: ${errors.join(', ')}` });
      }
  
      // Delete existing actions and update flow
      const updatedFlow = await prisma.flow.update({
        where: { id: parseInt(id, 10) },
        data: {
          triggerEvent,
          actions: {
            deleteMany: {}, // Remove all existing actions
            create: actions // Add new actions
          }
        },
        include: {
          actions: true
        }
      });
  
      res.status(200).json(updatedFlow);
    } catch (error) {
      console.error('Error updating flow:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  
  // Get all flows
  router.get('/flows', async (req, res) => {
    try {
      const flows = await prisma.flow.findMany();
      res.status(200).json(flows);
    } catch (error) {
      console.error('Error retrieving flows:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get a single flow by ID
  router.get('/flows/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const flow = await prisma.flow.findUnique({
        where: { id: parseInt(id, 10) },
      });
  
      if (flow) {
        res.status(200).json(flow);
      } else {
        res.status(404).json({ message: 'Flow not found' });
      }
    } catch (error) {
      console.error('Error retrieving flow:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Initiate an event
  router.post('/event', async (req, res) => {
    try {
      const { eventName, userEmail } = req.body;
  
      const flow = await prisma.flow.findFirst({
        where: { triggerEvent: eventName },
      });
  
      if (flow) {
        await flowQueue.add('executeFlow', { flowId: flow.id, userEmail });
        res.status(200).json({ message: 'Flow execution queued' });
      } else {
        res.status(404).json({ message: 'No matching flow found' });
      }
    } catch (error) {
      console.error('Error processing event:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // DELETE a single flow by ID
  router.delete('/flows/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      // Check if the flow exists
      const flowExists = await prisma.flow.findUnique({
        where: { id: parseInt(id, 10) },
      });
  
      if (!flowExists) {
        return res.status(404).json({ message: 'Flow not found' });
      }
  
      // Delete the flow (and associated actions)
      await prisma.flow.delete({
        where: { id: parseInt(id, 10) },
      });
  
      res.status(200).json({ message: 'Flow deleted successfully' });
    } catch (error) {
      console.error('Error deleting flow:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  export default router;
