import React, { ReactNode } from "react";
import { Fade, styled, Typography } from "@mui/material";
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

import { useTooltip } from "../../provider/TooltipProvider";

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    borderRadius: 10,
    padding: 10,
    transformOrigin: "bottom",
    '@media (min-height: 2160px)': {
      minWidth: '700px !important',
      padding: 15,
    },

  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.default,
  },
}));

const StyledTypography = styled(Typography)({
  fontSize: '1rem',
  '@media (min-height: 2160px)': {
    fontSize: '2rem',
  },
});

interface HelpTooltipProps {
  children: ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ children }) => {
  const { tooltipText, tooltipOpen } = useTooltip();

  return (
    <StyledTooltip
      open={tooltipOpen}
      title={
        <StyledTypography variant="caption" align="center">
          {tooltipText}
        </StyledTypography>
      }
      //FIXME: is it needed? it was there in Taso's version
      // PopperProps={{
      //   container: () => document.getElementById("#root"),
      // }}
      sx={{
        zIndex: -1,
      }}
      TransitionComponent={Fade}
      TransitionProps={{
        timeout: {
          enter: 500,
          appear: 500,
          exit: 500,
        },
      }}
    >
      <div>{children}</div>
    </StyledTooltip>
  );
};
