// @ts-nocheck
import React, { useRef, useImperativeHandle, forwardRef, ReactNode } from 'react';
// We still import the component and types from the original library
import Draggable, { DraggableProps } from 'react-draggable'; 

// Define the Props, ensuring they extend the original DraggableProps
interface DraggableContainerProps extends DraggableProps {
  children: ReactNode;
}

// ⚠️ FIX: We pass the props object (props) directly to the Draggable component,
// and correctly type the forwardRef function.
const DraggableContainer = forwardRef<Draggable, DraggableContainerProps>((props, ref) => {
  const innerRef = useRef<HTMLDivElement>(null);
  
  // Expose the ref methods that Draggable needs (like findDOMNode)
  useImperativeHandle(ref, () => ({
    // @ts-ignore: We are explicitly overriding the deprecated method
    findDOMNode: () => innerRef.current,
  }));

  // Render the Draggable component, spreading ALL props and ensuring the children are rendered
  return (
    // The innerRef is attached to the DOM element that wraps Draggable
    <div ref={innerRef} style={{ display: 'contents' }}>
      {/* ⚠️ CRITICAL FIX: Spread ALL props onto the Draggable component */}
      <Draggable {...props}>
        {props.children}
      </Draggable>
    </div>
  );
});

// Set a display name for better debugging
DraggableContainer.displayName = 'DraggableContainer';

export default DraggableContainer;
