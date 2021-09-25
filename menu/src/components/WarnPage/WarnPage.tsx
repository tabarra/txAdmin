import React, { useRef, useState } from "react";
import { Box, Fade, Typography } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { useNuiEvent } from "../../hooks/useNuiEvent";
import { useTranslate } from "react-polyglot";
// import { debugData } from "../../utils/debugLog";
import { ReportProblemOutlined } from "@mui/icons-material";

const useWarnInnerStyles = makeStyles({
  root: {
    color: "whitesmoke",
    transition: "transform 300ms ease-in-out",
    maxWidth: "700px",
  },
  inner: {
    padding: 32,
    border: "3px dashed whitesmoke",
    borderRadius: 12,
  },
  title: {
    display: "flex",
    margin: "-20px auto 18px auto",
    width: "max-content",
    borderBottom: "2px solid whitesmoke",
    paddingBottom: 5,
    fontWeight: 700,
  },
  message: {
    fontSize: "1.5em",
  },
  author: {
    textAlign: "right",
    fontSize: "0.8em",
    marginTop: 15,
    marginBottom: -15,
  },
  instruction: {
    marginTop: "1em",
    fontSize: "0.85em",
    textAlign: "center",
  },
});

interface WarnInnerComp {
  message: string;
  warnedBy: string;
}

const WarningIcon = () => (
  <ReportProblemOutlined
    style={{
      color: "darkSalmon",
      padding: "0 4px 0 4px",
      height: "3rem",
      width: "3rem",
    }}
  />
);

const WarnInnerComp: React.FC<WarnInnerComp> = ({ message, warnedBy }) => {
  const classes = useWarnInnerStyles();
  const t = useTranslate();

  return (
    <Box className={classes.root}>
      <Box className={classes.inner}>
        <Box className={classes.title}>
          <WarningIcon />
          <Typography variant="h3" style={{ fontWeight: 700 }}>
            {t("nui_warning.title")}
          </Typography>
          <WarningIcon />
        </Box>
        <Typography
          variant="h5"
          style={{
            textAlign: "center",
          }}
        >
          {message}
        </Typography>
        <Typography
          style={{
            textAlign: "right",
            marginBottom: -20,
          }}
          variant="body2"
        >
          {t("nui_warning.warned_by")} {warnedBy}
        </Typography>
      </Box>
      <Box className={classes.instruction}>{t("nui_warning.instruction")}</Box>
    </Box>
  );
};

const useMainPageStyles = makeStyles({
  root: {
    top: 0,
    left: 0,
    transition: "background-color 750ms ease-in-out",
    position: "absolute",
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  "@keyframes miniBounce": {
    "0%": {
      backgroundColor: "rgba(133, 3, 3, 0.95)",
    },
    "30%": {
      backgroundColor: "rgba(133, 3, 3, 0.60)",
    },
    "60%": {
      backgroundColor: "rgba(133, 3, 3, 0.30)",
    },
    "70%": {
      backgroundColor: "rgba(133, 3, 3, 0.60)",
    },
    "100%": {
      backgroundColor: "rgba(133, 3, 3, 0.95)",
    },
  },
  miniBounce: {
    animation: "miniBounce 500ms ease-in-out",
  },
});

interface SetWarnOpenData {
  reason: string;
  warnedBy: string;
}

// debugData([
//   {
//     action: 'setWarnOpen',
//     data: {
//       reason: 'You suck You suck You suck You suck You suck You suck You suck You suck You suck You suck',
//       warnedBy: 'Taso'
//     }
//   }
// ], 2000)

export const WarnPage: React.FC = ({}) => {
  const classes = useMainPageStyles();
  const pulseSound = useRef<HTMLAudioElement>(
    new Audio("assets/sounds/warning_pulse.mp3")
  );
  const openSound = useRef<HTMLAudioElement>(
    new Audio("assets/sounds/warning_open.mp3")
  );

  const [isMiniBounce, setIsMiniBounce] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [warnData, setWarnData] = useState<SetWarnOpenData | null>(null);

  useNuiEvent<SetWarnOpenData>("setWarnOpen", (warnData) => {
    setWarnData(warnData);
    setIsOpen(true);
    openSound.current.play();
  });

  useNuiEvent("pulseWarning", () => {
    setIsMiniBounce(true);
    pulseSound.current.play();
    setTimeout(() => {
      setIsMiniBounce(false);
    }, 500);
  });

  useNuiEvent("closeWarning", () => {
    setIsOpen(false);
  });

  const exitHandler = () => {
    setWarnData(null);
    pulseSound.current.play();
  };

  return (
    <Fade in={isOpen} onExit={exitHandler}>
      <Box
        bgcolor={isOpen ? "rgba(133, 3, 3, 0.95)" : "transparent"}
        className={
          !isMiniBounce ? classes.root : `${classes.root} ${classes.miniBounce}`
        }
      >
        {warnData && (
          <WarnInnerComp
            message={warnData.reason}
            warnedBy={warnData.warnedBy}
          />
        )}
      </Box>
    </Fade>
  );
};
