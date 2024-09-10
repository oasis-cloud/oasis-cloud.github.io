---
title: Pets
---
<style>
.cardList {
  list-style: none;
}
.card {
  display: flex;
  border: 1px solid #f0f0f0;
}
.avatar {
  margin: 20px;
}
.card-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.pet-times p:first-child {
  margin-top: 10px;
  margin-bottom:10px;
}
.pet-times p:nth-child(2) {
  margin-top:10px;
}
</style>
<ul class="cardList">
  <li class="card">
    <img width="100" height="auto" class="avatar" src="" />
    <div class="card-content">
      <div class="pet-name">红白地图</div>
      <div class="pet-times">
        <p>编码: <span>2024/6/12</span>-<em>250</em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <img width="100" height="auto" class="avatar" src="" />
    <div class="card-content">
      <div class="pet-name">红白地图</div>
      <div class="pet-times">
        <p>编码: <span>2024/8/12</span>-<em>250</em></p>
      </div>
    </div>
  </li>
</ul>
<script>
  const pets = document.querySelectorAll('.pet-times span')
  for(i = 0; i < pets.length; i++) {
    const pet = pets[i];
    const homeTime = pet.innerText
    const date = +new Date(homeTime)
    const now = +new Date()
    const days = Math.round((now - date) / 1000 / 86400)
    pet.parentNode.querySelector('em').innerText = days
  }
</script>
