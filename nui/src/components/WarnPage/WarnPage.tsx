import React, { useRef, useState } from "react";
import { styled } from '@mui/material/styles';
import { Box, Fade, Typography } from "@mui/material";
import { useNuiEvent } from "../../hooks/useNuiEvent";
import { useTranslate } from "react-polyglot";
import { debugData } from "../../utils/debugData";
import { ReportProblemOutlined } from "@mui/icons-material";


/**
 * Warn box
 */
const boxClasses = {
  root: `WarnBox-root`,
  inner: `WarnBox-inner`,
  title: `WarnBox-title`,
  message: `WarnBox-message`,
  author: `WarnBox-author`,
  instruction: `WarnBox-instruction`
};

const WarnInnerStyles = styled('div')({
  color: "whitesmoke",
  transition: "transform 300ms ease-in-out",
  maxWidth: "700px",

  [`& .${boxClasses.inner}`]: {
    padding: 32,
    border: "3px dashed whitesmoke",
    borderRadius: 12,
  },
  [`& .${boxClasses.title}`]: {
    display: "flex",
    margin: "-20px auto 18px auto",
    width: "max-content",
    borderBottom: "2px solid whitesmoke",
    paddingBottom: 5,
    fontWeight: 700,
  },
  [`& .${boxClasses.message}`]: {
    fontSize: "1.5em",
  },
  [`& .${boxClasses.author}`]: {
    textAlign: "right",
    fontSize: "0.8em",
    marginTop: 15,
    marginBottom: -15,
  },
  [`& .${boxClasses.instruction}`]: {
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
  const t = useTranslate();

  return (
    <WarnInnerStyles className={boxClasses.root}>
      <Box className={boxClasses.inner}>
        <Box className={boxClasses.title}>
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
      <Box className={boxClasses.instruction}>{t("nui_warning.instruction")}</Box>
    </WarnInnerStyles>
  );
};


/**
 * Main warn container (whole page)
 */
const mainClasses = {
  root: `MainWarn-root`,
  miniBounce: `MainWarn-miniBounce`,
}

const MainPageStyles = styled('div')(({
  [`& .${mainClasses.root}`]: {
    top: 0,
    left: 0,
    transition: "background-color 750ms ease-in-out",
    position: "absolute",
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(133, 3, 3, 0.95)",
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
  [`& .${mainClasses.miniBounce}`]: {
    animation: "miniBounce 500ms ease-in-out",
  },
}));

export interface SetWarnOpenData {
  reason: string;
  warnedBy: string;
}

export const WarnPage: React.FC = ({ }) => {
  const pulseSound = useRef<HTMLAudioElement>(
    new Audio("sounds/warning_pulse.mp3")
  );
  const openSound = useRef<HTMLAudioElement>(
    new Audio("sounds/warning_open.mp3")
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
    pulseSound.current.play();
  };

  return (
    <MainPageStyles>
      <Fade in={isOpen} onExit={exitHandler}>
        <Box
          className={
            !isMiniBounce ? mainClasses.root : `${mainClasses.root} ${mainClasses.miniBounce}`
          }
        >
          <WarnInnerComp
            message={warnData?.reason ?? ''}
            warnedBy={warnData?.warnedBy ?? ''}
          />
        </Box>
      </Fade>
    </MainPageStyles>
  );
};

/**
 * Browser mock
 */
// debugData([
//   {
//     action: 'setWarnOpen',
//     data: {
//       reason: 'Stop doing bad things 😠',
//       warnedBy: 'Tabby'
//     }
//   }
// ], 500)
// setInterval(() => {
//   debugData([
//     {
//       action: 'pulseWarning',
//       data: {}
//     }
//   ]);
// }, 1000);
// debugData([
//   {
//     action: 'closeWarning',
//     data: {}
//   }
// ], 2_000);
