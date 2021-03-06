import React, { useCallback, useEffect, useState } from "react";
import _ from "lodash";
import { compose } from "recompose";
import { withFirebase } from "components/Firebase";
import { Button } from "@material-ui/core";
import ConfirmDialog from "components/__dialogs/ConfirmDialog";
import "./InfoSessionDetails.scss";

enum SIGN_STATUS {
  ACCEPTED = "Zaakceptowano",
  PENDING = "Oczekuje na potwierdzenie",
  SIGNABLE = "Zapisz się na sesje",
}

interface IInfoSessionDetailsProps {
  sessionData: any;
  firebase: any;
  disableTabs: (arg: boolean) => any;
}

const InfoSessionDetails: React.FC<IInfoSessionDetailsProps> = ({ firebase, sessionData, disableTabs }) => {
  const [buttonState, setButtonState] = useState(SIGN_STATUS.SIGNABLE);
  const [hostUsername, setHostUsername] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    firebase
      .session(sessionData.uuid)
      .child("willing")
      .once("value", (snapshot: any) => {
        if (!_.isNil(snapshot.val())) {
          const userID = firebase.auth.currentUser.uid;
          const data = snapshot.val();
          const filteredData = _.filter(data, (item: any) => {
            return item === userID;
          });
          if (filteredData.length !== 0) {
            setButtonState(SIGN_STATUS.PENDING);
            disableTabs(true);
          }
        } else {
          firebase
            .session(sessionData.uuid)
            .child("accepted")
            .once("value", (snapshot: any) => {
              if (!_.isNil(snapshot.val())) {
                const userID = firebase.auth.currentUser.uid;
                const data = snapshot.val();
                const filteredData = _.filter(data, (item: any) => {
                  return item === userID;
                });
                if (filteredData.length !== 0) {
                  setButtonState(SIGN_STATUS.ACCEPTED);
                  disableTabs(false);
                }
              } else {
                setButtonState(SIGN_STATUS.SIGNABLE);
                disableTabs(true);
              }
            });
        }
      });
  }, [buttonState, disableTabs, firebase, sessionData.uuid]);

  const onJoinSessionClickHandler = useCallback(() => {
    const userID = firebase.auth.currentUser.uid;
    const willingRef = firebase.session(sessionData.uuid).child("willing");
    const pushKey = willingRef.push();
    willingRef
      .once("value", (snapshot: any) => {
        if (_.isNil(snapshot.val())) {
          return firebase.session(sessionData.uuid).update({ willing: { [pushKey.key]: userID } });
        }
        const data = snapshot.val();
        const filteredData = _.filter(data, (item: any) => {
          return item === userID;
        });
        if (filteredData.length === 0) {
          willingRef.push(userID);
        }
      })
      .then(() => {
        setButtonState(SIGN_STATUS.PENDING);
        disableTabs(true);
      });
  }, [disableTabs, firebase, sessionData.uuid]);

  const onLeaveSessionClickHandler = useCallback(() => {
    const userID = firebase.auth.currentUser.uid;
    const willingRef = firebase.session(sessionData.uuid).child("willing");
    const acceptedRef = firebase.session(sessionData.uuid).child("accepted");
    if (buttonState === SIGN_STATUS.PENDING) {
      willingRef
        .once("value", (snapshot: any) => {
          const key = Object.keys(snapshot.val()).find((key) => snapshot.val()[key] === userID);
          willingRef.child(key).remove();
        })
        .then(() => {
          disableTabs(true);
          setButtonState(SIGN_STATUS.SIGNABLE);
          setOpenDialog(false);
        });
    } else if (buttonState === SIGN_STATUS.ACCEPTED) {
      acceptedRef
        .once("value", (snapshot: any) => {
          const key = Object.keys(snapshot.val()).find((key) => snapshot.val()[key] === userID);
          acceptedRef.child(key).remove();
        })
        .then(() => {
          disableTabs(true);
          setButtonState(SIGN_STATUS.SIGNABLE);
          setOpenDialog(false);
        });
    }
  }, [buttonState, disableTabs, firebase, sessionData.uuid]);

  const fetchHostName = useCallback(() => {
    firebase
      .user(sessionData.user)
      .child("username")
      .once("value", (snapshot: any) => {
        setHostUsername(snapshot.val());
      });
    return hostUsername;
  }, [firebase, hostUsername, sessionData.user]);

  const buttonText = () => {
    switch (buttonState) {
      case SIGN_STATUS.SIGNABLE:
        return SIGN_STATUS.SIGNABLE;
      case SIGN_STATUS.PENDING:
        return SIGN_STATUS.PENDING;
      case SIGN_STATUS.ACCEPTED:
        return SIGN_STATUS.ACCEPTED;
    }
  };

  const openDialogHandler = () => {
    setOpenDialog(true);
  };

  const closeDialogHandler = () => {
    setOpenDialog(false);
  };

  return (
    <div className="session-details-container">
      <div className="session-details-title">{sessionData.name}</div>
      <div className="session-details-date">{sessionData.date}</div>
      <div className="session-details-buttons">
        <Button
          className="signing-button"
          variant="contained"
          onClick={onJoinSessionClickHandler}
          disabled={buttonState !== SIGN_STATUS.SIGNABLE}
        >
          {buttonText()}
        </Button>
        {buttonState !== SIGN_STATUS.SIGNABLE && (
          <Button className="unsigning-button" variant="contained" onClick={openDialogHandler}>
            Opuść sesję
          </Button>
        )}
      </div>
      <div className="session-details">
        <div className="session-details__creator">Twórca sesji: {fetchHostName()}</div>
        <div>Aktualny status: {sessionData.status}</div>
        <div>System: {sessionData.system}</div>

        <div>Maksymalna ilośc graczy: {sessionData.maxPlayers}</div>
        <div>Dodatkowe info: {sessionData.info}</div>
      </div>
      {openDialog && (
        <ConfirmDialog
          text={"Czy na pewno chcesz opuścić sesję?"}
          state={openDialog}
          confirmHandler={onLeaveSessionClickHandler}
          closeHandler={closeDialogHandler}
        />
      )}
    </div>
  );
};

export default compose<IInfoSessionDetailsProps, any>(withFirebase)(React.memo(InfoSessionDetails));
