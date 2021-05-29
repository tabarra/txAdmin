import { makeStyles, Theme } from "@material-ui/core";

export const useStyles = makeStyles((theme: Theme) => ({
  closeButton: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(2)
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '80px 80px 80px 130px',
    columnGap: 10,
    rowGap: 10,
    paddingBottom: 15
  },
  codeBlock: {
    background: theme.palette.background.paper,
    borderRadius: 8,
    padding: '10px 10px',
    marginBottom: 7
  },
  codeBlockText: {
    fontFamily: "monospace"
  },
  historyItem: {
    background: theme.palette.background.paper,
    padding: '10px 10px',
    marginBottom: 7,
    display: 'flex',
    justifyContent: 'space-between'
  }
}))
