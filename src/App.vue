<template>
  <div class="mask">
    <div v-show="state.in_the_game " class="info">
      <div class="gaming-score">
        得分：<span class="current-score">{{ state.current_score }}</span></div>
    </div>
    <div div class="content">
      <div class="score-container">
        <p class="title">本次得分</p>
        <h1 class="score">0</h1>
      </div>
      <button class="restart">restart</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
  
const state = reactive({ 
  in_the_game: false,
  current_score: 0
});

function restart() {
  state.in_the_game = true;
  // game._restart();
}
</script>
<style scoped>
 .mask{
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.4);
  }
  .content{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 500px;
    height: 500px;
    border-radius: 20px;
    background: rgba(0,0,0,0.4);
    border: 5px solid rgba(255,255,255,0.05);

  }
  .score-container{
    color: #ffffff;
    text-align: center;
  }
  .title{
    font-size: 20px;
    font-weight: bold;
    color: rgba(255,255,255,0.6);
  }
  .score{
    font-size: 100px;
    font-weight: bold;
    margin-top: 20px;
  }
  button.restart{
    width: 200px;
    height: 40px;
    line-height: 40px;
    border-radius: 20px;
    background: white;
    border: none;
    font-weight: bold;
    font-size: 20px;
    cursor: pointer;
    color:#7b7979;
  }
  button.restart:hover{
    color:#232323;
  }
  .info{
    margin: 20px 0;
    position: absolute;
    text-align: center;
    opacity: 0.2;
    width:100%;
  }
  .gaming-score{
    margin-top: 50px;
    color: #FFF;
    font-size: 26px;
  }
	audio{
		margin-top: 10px;
	}
</style>
