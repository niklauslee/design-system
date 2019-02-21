import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import styled, { css } from 'styled-components';
import Text from './Text';

const StyledTooltipContainer = styled.div`
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  position: fixed;
  transition-delay: 0ms;
  transition-property: opacity;

  ${(props) => props.active && css`
    transition-delay: 800ms;
    opacity: 1;
  `}
`;

const StyledTooltipPanel = styled.div`
  border-radius: 4px;
  position: fixed;
  background: hsla(0,0%,0%,.8);
  padding: 7px;
`;

const StyledArrow = styled.div`
  position: relative;

  &::after {
    border: solid transparent;
    content: '';
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
    border-color: transparent;
    margin-left: 0;
    border-width: 5px;
  }
  
  ${(props) => props.direction === 'top' && css`
    &::after {
      border-top-color: hsla(0,0%,0%,.8);
    }
  `}
  
  ${(props) => props.direction === 'right' && css`
    &::after {
      border-right-color: hsla(0,0%,0%,.8);
    }
  `}
  
  ${(props) => props.direction === 'bottom' && css`
    &::after {
      border-bottom-color: hsla(0,0%,0%,.8);
    }
  `}
  
  ${(props) => props.direction === 'left' && css`
    &::after {
      border-left-color: hsla(0,0%,0%,.8);
    }
  `}
`;

const ARROW_HEIGHT = 5;
const ARROW_WIDTH = 5;

const getBounds = (element) => element.getBoundingClientRect();

const getTooltipLayout = (
  alignment,
  direction,
  tooltipBounds,
  targetBounds,
) => {
  // Determine the middle of the target, as the both the placement of the tooltip body and the arrow are relative to it
  const targetMiddle = {
    left: targetBounds.left + targetBounds.width / 2,
    top: targetBounds.top + targetBounds.height / 2,
  };

  // Values for the tooltip's left edge which place it at the following positions
  const left = {
    start: targetBounds.left,
    middle: targetMiddle.left - tooltipBounds.width / 2,
    end: targetBounds.right - tooltipBounds.width,
  };

  // Values for the tooltip's top edge which place it at the following positions
  const top = {
    start: targetBounds.top,
    middle: targetMiddle.top - tooltipBounds.height / 2,
    end: targetBounds.bottom - tooltipBounds.height,
  };

  // Values for top and left at which the tooltip must start in order for its inner edge to be positioned at the correct
  // distance from the target's outer edge
  const origin = {
    top: targetBounds.top - tooltipBounds.height - ARROW_HEIGHT,
    right: targetBounds.right + ARROW_WIDTH,
    bottom: targetBounds.bottom + ARROW_HEIGHT,
    left: targetBounds.left - tooltipBounds.width - ARROW_HEIGHT,
  };

  const tooltipPositionCalculations = {
    top: {
      start: () => ({ left: left.start, top: origin.top }),
      middle: () => ({ left: left.middle, top: origin.top }),
      end: () => ({ left: left.end, top: origin.top }),
    },
    right: {
      start: () => ({ left: origin.right, top: top.start }),
      middle: () => ({ left: origin.right, top: top.middle }),
      end: () => ({ left: origin.right, top: top.end }),
    },
    bottom: {
      start: () => ({ left: left.start, top: origin.bottom }),
      middle: () => ({ left: left.middle, top: origin.bottom }),
      end: () => ({ left: left.end, top: origin.bottom }),
    },
    left: {
      start: () => ({ left: origin.left, top: top.start }),
      middle: () => ({ left: origin.left, top: top.middle }),
      end: () => ({ left: origin.left, top: top.end }),
    },
  };

  const arrowPositionCalculations = {
    top: () => ({
      top: targetBounds.top - ARROW_HEIGHT,
      left: targetMiddle.left - ARROW_WIDTH / 2,
    }),
    right: () => ({
      top: targetMiddle.top - ARROW_HEIGHT / 2,
      left: targetBounds.right,
    }),
    bottom: () => ({
      top: targetBounds.bottom,
      left: targetMiddle.left - ARROW_WIDTH / 2,
    }),
    left: () => ({
      top: targetMiddle.top - ARROW_HEIGHT / 2,
      left: targetBounds.left - ARROW_WIDTH,
    }),
  };

  return {
    tooltipPosition: tooltipPositionCalculations[direction][alignment](),
    arrowPosition: arrowPositionCalculations[direction](),
  };
};

const Tooltip = () => {
  const [state, setState] = useState({});
  const tooltip = useRef(null);

  useEffect(() => {
    // Build mouseover listener
    const handleAttention = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) { return; }
      const { tooltipContent, tooltipDirection, tooltipAlignment } = target.dataset;

      if (!tooltipContent || target === state.target) {
        // If two consecutive attention events occur to the same element, we can hide the tooltip
        setState({ ...state, target: null, active: false });
      } else {
        if (target.tabIndex === -1) {
          console.warn('🚨 tabIndex has not been defined on a component with data-tooltip-content attribute!');
        }

        // Otherwise, we should show it for this element
        setState({
          target,
          // start | middle | end
          direction: (tooltipDirection || 'start'),
          // top | right | bottom | left
          alignment: (tooltipAlignment || 'bottom'),
          content: tooltipContent,
          layout: {},
          dirty: true,
          active: true,
        });
      }
    };

    window.addEventListener('mouseover', handleAttention);
    window.addEventListener('focusin', handleAttention);

    return () => {
      window.removeEventListener('mouseover', handleAttention);
      window.removeEventListener('focusin', handleAttention);
    };
  });

  useLayoutEffect(() => {
    if (!state.active || !state.dirty) { return; }

    // We've just rendered the tooltip. If there is content, determine tooltip's new position based on that content:
    const { direction, alignment, target } = state;
    const newLayout = getTooltipLayout(
      alignment,
      direction,
      getBounds(tooltip.current),
      getBounds(target),
    );

    setState({ ...state, layout: newLayout, dirty: false });
  });

  const { layout = {} } = state;
  return (
    <StyledTooltipContainer active={state.active}>
      <StyledArrow direction={state.direction} style={{ ...layout.arrowPosition }} />
      <StyledTooltipPanel ref={tooltip} style={{ ...layout.tooltipPosition }}>
        <Text nowrap size2 color_white>
          {state.content}
        </Text>
      </StyledTooltipPanel>
    </StyledTooltipContainer>
  );
};

export default Tooltip;
