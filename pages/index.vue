<template>
  <div class="center" style='height: 100vh; background: #F5F5F5'>
    <div class="wrapper">
      <h2>트랜스포터</h2>
      <div>
        <div class="fx-space-between tableHead">
          <div style="width: 25%;">연결상태</div>
          <div style="width: 25%;">전송기</div>
          <div style="width: 25%;">송수신구분값</div>
          <div style="width: 25%;">액션</div>
        </div>
        <li v-for="(item, idx) in PORTLIST" :key="idx" class="fx-space-between tableList"
            style="list-style: none; width: 100%;">
          <div class="tableList" style="width: 25%;">
            <div :class="
          (item.status === connected) ? 'status-connected' : (item.status === broken) ? 'status-broken' : 'status-wait'"></div>
            {{ item.status }}
          </div>
          <div class="tableList" style="width: 25%;">{{ item.index }}번 조명</div>
          <div class="tableList" style="width: 25%;">
            {{ item.message }}
          </div>
          <div class="tableList" style="width: 25%;">
            <div v-if="!(item.status === connected)">
              <button id="open" @click="portOpen(item.id)">연결하기</button>
            </div>
            <div v-if="item.status === connected && item.msgStatus === sendWait">
              <button id="sendInterval" @click="sendMessage(item.id, item.message)">전송 시작</button>
            </div>
            <div v-if="item.msgStatus === sending">
              <button id="end" @click="stopMessage(item.id)">전송 중단</button>
            </div>
          </div>
        </li>
      </div>
    </div>
  </div>
</template>
<script setup>
import {reactive, ref} from "vue";
import {usePortStore} from '@/store/port/port-store';

const messageErrorRef = ref(false)
const portStore = usePortStore()

let portList = []
let portMsgList = []

const connected = "연결됨"
const broken = "연결끊김"
const sending = "전송중"
const sendWait = "전송대기"

const PORTLIST = reactive([
  {
    index: 1,
    id: "FSTPT1",
    status: "연결대기",
    message: "[D12]",
    msgStatus: "전송대기"
  },
  {
    index: 2,
    id: "SCDPT2",
    status: "연결대기",
    message: "[D22]",
    msgStatus: "전송대기"
  },
  {
    index: 3,
    id: "THRDPT3",
    status: "연결대기",
    message: "[D32]",
    msgStatus: "전송대기"
  },
]);

const portOpen = (portId) => {
  portStore.portOpen(portId)
}

const sendMessage = async (portId, message) => {
  await portStore.sendMessage(portId, message)
  messageErrorRef.value = portStore.showMessageError()

  // 메세지 전송 에러 처리 필요
  // const error = portStore.showMessageError()
  // if (error.length > 0) {
  //   window.alert('연결을 확인해주세요')
  // } else {
  //   console.log('ok')
  // }
}

const stopMessage = (portId) => {
  portStore.messageStop(portId)
}

// 포트 연결 & 메세지 전송 상태관리
setInterval(() => {
    portList = portStore.showStatus()
    const connectionStablePort = PORTLIST.filter(o1 => portList.some(o2 =>
      o1.id === o2.id && o2.calledPort.readable !== null && o2.status === 'connected'));
    const connectionBrokenPort = PORTLIST.filter(o1 => portList.some(o2 =>
      o1.id === o2.id && o2.calledPort.readable !== null && o2.status === 'broken'));

    portMsgList = portStore.showPortMsgStatus()

    const messageSendingPort = PORTLIST.filter(o1 => portMsgList.some(o2 =>
      o1.id === o2.id && o2.msgStatus === 'sending'));
    const messageNotSendingPort = PORTLIST.filter(o1 => portMsgList.some(o2 =>
      o1.id === o2.id && o2.msgStatus === 'standby'));

    connectionBrokenPort.forEach(port => {
      port.status = '연결끊김'
    })
    connectionStablePort.forEach(port => {
      port.status = '연결됨'
    })
    messageSendingPort.forEach(port => {
      port.msgStatus = '전송중'
    })
    messageNotSendingPort.forEach(port => {
      port.msgStatus = '전송대기'
    })
  },
  1000)
</script>

<style scoped>
.wrapper {
  width: 1440px;
  height: 624px;
  border: solid 1px #CED3D6;
  background: white;
  padding: 40px;
}

.tableList {
  border-bottom: 1px solid #E5E5E5;
  height: 42px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tableHead > div {
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #F5F5F5;
  border-top: 1px solid #333333;
}

.status-connected {
  height: 10px;
  width: 10px;
  margin-right: 8px;
  border-radius: 60px;
  background: #99CE1E;
}

.status-broken {
  height: 10px;
  width: 10px;
  margin-right: 8px;
  border-radius: 60px;
  background: red;
}

.status-wait {
  height: 10px;
  width: 10px;
  margin-right: 8px;
  border-radius: 60px;
  background: #999999;
}

button {
  width: 68px;
  height: 32px;
  background: white;
  border: 1px solid #999999;
}
</style>