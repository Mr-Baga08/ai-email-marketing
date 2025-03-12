import React from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from './alert-dialog';

/**
 * ConfirmDialog component for displaying confirmation prompts
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Trigger element for the dialog
 * @param {string} [props.title] - Title of the confirmation dialog
 * @param {string} [props.description] - Description or message of the dialog
 * @param {string} [props.confirmText] - Text for the confirm button
 * @param {string} [props.cancelText] - Text for the cancel button
 * @param {function} props.onConfirm - Callback function when confirmed
 * @param {function} [props.onCancel] - Optional callback function when canceled
 * @param {string} [props.confirmVariant] - Variant of the confirm button
 * @param {boolean} [props.open] - Controlled open state of the dialog
 * @param {function} [props.onOpenChange] - Callback for open state changes
 */
const ConfirmDialog = ({
  children,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'destructive',
  open,
  onOpenChange
}) => {
  // Determine button variants
  const buttonVariants = {
    destructive: 'bg-red-500 hover:bg-red-600 text-white',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white'
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            className={`${buttonVariants[confirmVariant] || buttonVariants.destructive}`}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;