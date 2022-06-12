import React, { ReactNode } from "react";
import { Fade, Theme, Tooltip, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

import { useTooltip } from "../../provider/TooltipProvider";

const useStyles = makeStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    borderRadius: 10,
    padding: 10,
    transformOrigin: "bottom",
    animationIterationCount: "infinite",
    animationDuration: "2s",
    animationTimingFunction: "ease",
  },
  arrow: {
    color: theme.palette.background.default,
  },
  //FIXME: broken since react 18
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
}));

interface HelpTooltipProps {
  children: ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ children }) => {
  const classes = useStyles();
  const { tooltipText, tooltipOpen } = useTooltip();

  return (
    <Tooltip
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
    </Tooltip>
  );
};
