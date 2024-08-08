import type { Action } from '@prisma/client'


//function to validate an action using some certain rules 
export function validateActions(actions: Action[]) {
    const errors = [];
    const actionTypes = ['email', 'delay'];
    const orders = new Set();
  
    // Validate actions
    if (!Array.isArray(actions)) {
      return  errors.push ( 'Actions must be an array' );
    }

    for (const action of actions) {
      if (!actionTypes.includes(action.type)) {
        errors.push(`Invalid action type: ${action.type}`);
      }
      if (orders.has(action.order)) {
        errors.push(`Duplicate order number: ${action.order}`);
      }
      orders.add(action.order);
    }
  
    return errors;
  }