import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Fade,
  makeStyles,
  Theme,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { txAdminMenuPage, usePageValue } from "../../state/page.state";
import { useIsMenuVisible } from "../../state/visibility.state";
import { useDialogContext } from '../../provider/DialogProvider';

const RANDOM_CHANGE_TIME = 12000;
const TIME_FOR_TOOLTIP_TO_APPEAR = 3000;

const useStyles = makeStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    borderRadius: 10,
    padding: 10,
    transformOrigin: "bottom",
    animationIterationCount: "infinite",
    animationDuration: "2s",
    animationName: "$bounce-tool-tip",
    animationTimingFunction: "ease",
  },
  arrow: {
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
}));

export const HelpTooltip: React.FC = ({ children }) => {
  const classes = useStyles();
  const timeTillOpenRef = useRef<NodeJS.Timer | null>(null);
  const changeMsgTimeRef = useRef<NodeJS.Timer | null>();

  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const isMenuVisible = useIsMenuVisible();
  const { isDialogOpen } = useDialogContext()

  const TooltipMessages = useMemo(
    () => [
      "Use [TAB] to switch pages & the arrow keys to navigate menu items",
      "Certain menu items have sub options which can be selected using the left & right arrow keys",
    ],
    []
  );

  const getNewTooltip = useCallback((): string => {
    const generateNewTooltipRandomly = () =>
      TooltipMessages[Math.floor(Math.random() * TooltipMessages.length)];

    let newTooltip = generateNewTooltipRandomly();
    while (newTooltip === tooltipContent) {
      newTooltip = generateNewTooltipRandomly();
    }

    return newTooltip;
  }, [TooltipMessages]);

  const curPage = usePageValue();

  useEffect(() => {
    if (!isMenuVisible) setTooltipOpen(false)
  }, [isMenuVisible])

  useEffect(() => {
    if (isDialogOpen) setTooltipOpen(false)
  }, [isDialogOpen])

  useEffect(() => {
    if (!isMenuVisible) return;

    if (curPage === txAdminMenuPage.Main) {
      timeTillOpenRef.current = setTimeout(() => {
        const msg = getNewTooltip();
        setTooltipOpen(true);
        setTooltipContent(msg);
      }, TIME_FOR_TOOLTIP_TO_APPEAR);
    } else {
      setTooltipOpen(false);
    }

    return () => {
      if (timeTillOpenRef.current) {
        clearTimeout(timeTillOpenRef.current);
        timeTillOpenRef.current = null;
      }
    };
  }, [curPage, isMenuVisible]);

  useEffect(() => {
    if (tooltipOpen) {
      changeMsgTimeRef.current = setInterval(() => {
        const tooltip = getNewTooltip();
        setTooltipContent(tooltip);
        changeMsgTimeRef.current = null;
      }, RANDOM_CHANGE_TIME);
    } else {
      changeMsgTimeRef.current = null
    }

    return () => {
      if (changeMsgTimeRef.current) {
        clearInterval(changeMsgTimeRef.current);
        changeMsgTimeRef.current = null;
      }
    };
  }, [tooltipOpen]);

  return (
    <Tooltip
      open={tooltipOpen}
      title={
        <Typography variant="caption" align="center">
          {tooltipContent}
        </Typography>
      }
      arrow
      TransitionComponent={Fade}
      TransitionProps={{
        timeout: {
          enter: 500,
          appear: 500,
          exit: 50,
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
