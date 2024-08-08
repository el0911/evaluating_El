import { prisma } from './prisma'
import { flowQueue } from './queue'
import type { Action, Flow } from '@prisma/client'


const sendEmail = async (): Promise<boolean> => {
  const randomNumber = Math.random();
  await new Promise(resolve => setTimeout(resolve, 1000));
  return randomNumber < 0.95;
};

// Function to execute actions hard coded delay and email task
const executeAction = async (action: Action, userEmail: string, flowId: number, retryCount: number = 0): Promise<void> => {
  try {
    if (action.type === 'delay' && action.delayMinutes) {
      await flowQueue.add(
        'executeFlow',
        { flowId, userEmail, currentActionOrder: action.order },
        { delay: action.delayMinutes * 60 * 1000 }
      );
      console.log(`Queued next action after ${action.delayMinutes} minutes delay`);
    } else if (action.type === 'email') {
      const success = await sendEmail();
      if (!success) {
        if (retryCount < 5) {
          console.log(`Email send failed. Retrying in 5 minutes. Attempt ${retryCount + 1} of 5`);
          await flowQueue.add(
            'executeFlow',
            { flowId, userEmail, currentActionOrder: action.order, retryCount: retryCount + 1 },
            { delay: 5 * 60 * 1000 }
          );
        } else {
          console.error(`Failed to send email to ${userEmail} after 5 attempts`);
          await prisma.failedFlow.create({
            data: {
              flowId,
              actionId: action.id,
              userEmail,
              error: 'Failed to send email after 5 attempts'
            }
          });
        }
      } else {
        console.log(`Email sent to ${userEmail}: ${action.emailSubject}`);
        await executeFlow(flowId, userEmail, action.order);
      }
    }
  } catch (error) {
    console.error(`Error executing action:`, error);
    await prisma.failedFlow.create({
      data: {
        flowId,
        actionId: action.id,
        userEmail,
        error: (error as Error).message
      }
    });
  }
};

//function to run a fow it takes the flowId and user email then initiates the flow from position, maybe a bit redundant but no more time to optemise ! 
export const executeFlow = async (flowId: number, userEmail: string, currentActionOrder: number = 0, retryCount: number = 0): Promise<void> => {
  try {
    const nextAction = await prisma.action.findFirst({
      where: {
        flowId: flowId,
        order: { gt: currentActionOrder }
      },
      orderBy: {
        order: 'asc'
      }
    });

    if (nextAction) {
      await executeAction(nextAction, userEmail, flowId, retryCount);
    } else {
      console.log(`Flow execution completed for flowId: ${flowId}`);
    }
  } catch (error) {
    console.error(`Error executing flow ${flowId}:`, error);
  }
};