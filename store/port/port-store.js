import {defineStore} from "pinia";

export const usePortStore = defineStore('port-store', () => {

  // if workingPort === null 이면 포트 갖고오도록 안전하게 설계하기
  let workingPort = [];
  const stopPortMessage = [];
  const portStatus = [];
  let portMsgStatus = [];

  let setIntervalStop = false;
  let setMessageError = [];

  const portOpen = async (portId) => {
    const filters = [{usbVendorId: 0x0403, usbProductId: 0x6001}];
    await navigator.serial.requestPort({filters})
      .then(calledPort => {
        console.log(calledPort)
        calledPort.open({baudRate: 38400, parity: 'none', dataBits: 8})

        const namedPort = {
          id: portId, status: 'connected', msgStatus: 'standby', calledPort
        }
        workingPort.push(namedPort)
        portStatus.push(namedPort)

        return namedPort
      })
      .then(port => {
        port.calledPort.addEventListener('disconnect', (event) => {
          port.status = "broken"
          workingPort = workingPort.filter(wp => {
            return wp.status !== 'broken'
          })
        })
      })
      .catch((err) => console.log(err))
  }

  const showStatus = () => {
    return portStatus
  }

  const sendMessage = async (portId, message) => {
    const portList = await navigator.serial.getPorts()
    console.log(portList)

    const selectedPort = workingPort.filter(wp => wp.id === portId)
    console.log(selectedPort)

    try {
      const filteredPort = portList.filter(pl => pl === selectedPort[0].calledPort)

      const filteredPortMsgCheck = {
        id: selectedPort[0].id,
        status: 'connected',
        msgStatus: 'standby',
        port: selectedPort[0].calledPort
      }


      const writer = filteredPort[0].writable.getWriter();

      const namedWriter = {
        id: selectedPort[0].id,
        writer
      }

      const enc = new TextEncoder(); // always utf-8
      const data = enc.encode(message);

      const interval = setInterval(async () => {
        const messageStopNeededPort = stopPortMessage.filter(id => id === namedWriter.id)
        if (setIntervalStop === true && namedWriter.id === messageStopNeededPort[0]) {
          console.log("message stopped")
          clearInterval(interval)
          stopPortMessage.length = 0;
          namedWriter.writer.releaseLock()

          const portMsgStatusToBeChanged = portMsgStatus.filter(port =>
            port.id === namedWriter.id
          )
          portMsgStatusToBeChanged.forEach(port => {
            port.msgStatus = 'standby'
          })
          portMsgStatus = portMsgStatusToBeChanged
        } else {
          // console.log(message)
          await namedWriter.writer.write(data)
            .then(() => {
                console.log(message)
                setMessageError = []
                filteredPortMsgCheck.msgStatus = 'sending'
                if (
                  !portMsgStatus.includes(filteredPortMsgCheck)
                ) {
                  portMsgStatus.push(filteredPortMsgCheck)
                }
                console.log(portMsgStatus)
                if (portMsgStatus.length === 2) {
                  if (portMsgStatus[0].id === portMsgStatus[1].id) {
                    portMsgStatus.splice(0, 1)
                  }
                }
                if (portMsgStatus.length > 2) {
                  let i, j;
                  for (i = 0; i < portMsgStatus.length; i++) {
                    for (j = 1; j < portMsgStatus.length; j++)
                      if (portMsgStatus[i].id === portMsgStatus[j].id) {
                        portMsgStatus.splice(i, 1)
                      }
                  }
                }
              }
            )
            .catch((err) => {
              setMessageError.push({id: namedWriter.id})
              console.log(setMessageError)
              console.log(err)
            })
        }
      }, 1000)
    } catch (error) {
      console.log(error)
      setMessageError.push({id: null})
    }
  }

  const showPortMsgStatus = () => {
    return portMsgStatus
  }

  const showMessageError = () => {
    return setMessageError
  }

  const messageStop = (portId) => {
    stopPortMessage.push(portId)
    setIntervalStop = true;
  }

  return {
    portOpen, showStatus, sendMessage, messageStop, showMessageError, showPortMsgStatus
  }
})
