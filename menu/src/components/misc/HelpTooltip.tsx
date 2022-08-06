import React, { ReactNode } from "react";
import {Fade, styled, Theme, Tooltip, Typography} from "@mui/material";

import { useTooltip } from "../../provider/TooltipProvider";

const PREFIX = 'HelpTooltip'

const classes = {
  tooltip: `${PREFIX}-tooltip`,
  arrow: `${PREFIX}-arrow`,
}

const StyledHelpTooltip = styled(Tooltip)(({theme}) => ({
  [`& ${classes.tooltip}`]: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    borderRadius: 10,
    padding: 10,
    transformOrigin: "bottom",
    animationIterationCount: "infinite",
    animationDuration: "2s",
    animationTimingFunction: "ease",
  },
  [`& ${classes.arrow}`]: {
    color: theme.palette.background.default,
  },
  "@keyframes bounce-tool-tip": {
    "0%": {
      transform: "translateY(0)",
    },
    "50%": {
      transform: "translateY(3px)",
    },
    "100%": {
      transform: "translateY(0)",
    },
  },
}))

interface HelpTooltipProps {
  children: ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ children }) => {
  const { tooltipText, tooltipOpen } = useTooltip();

  return (
    <StyledHelpTooltip
      open={tooltipOpen}
      title={
        <Typography variant="caption" align="center">
          {tooltipText}
        </Typography>
      }
      PopperProps={{
        container: () => document.getElementById("#root"),
      }}
      arrow
      TransitionComponent={Fade}
      TransitionProps={{
        timeout: {
          enter: 500,
          appear: 500,
          exit: 500,
        },
      }}
      classes={{
        tooltip: classes.tooltip,
        arrow: classes.arrow,
      }}
    >
      <div>{children}</div>
    </StyledHelpTooltip>
  );
};
