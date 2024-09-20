---
title: Pets
---
<style>
.cardList {
  list-style: none;
}
.card {
  display: flex;
  padding-left: 20px;
  border: 1px solid #76F562;
  background: #76F562;
}
.dead {
  border: 1px solid #5e5e5e;
  background: #5e5e5e;
}
.avatar {
  margin: 20px;
}
.card-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.pet-name {
  margin-top: 10px;
}
.pet-times p:first-child {
  margin-top: 10px;
  margin-bottom:10px;
}
.pet-times p:nth-child(2) {
  margin-top:10px;
}
.pet-dead p:first-child {
  margin-top: 10px;
  margin-bottom:10px;
}
.pet-dead p:nth-child(2) {
  margin-top:10px;
}
</style>
<ul class="cardList">
  <li class="card">
    <div class="card-content">
      <div class="pet-name">黑地图</div>
      <div class="pet-times">
        <p>编码: <span>2024/2/19</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">白地图</div>
      <div class="pet-times">
        <p>编码: <span>2024/2/19</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card dead">
    <div class="card-content">
      <div class="pet-name">龙凤鲤</div>
      <div class="pet-times">
        <p>编码: <span>2024/2/19</span>-<em></em></p>
      </div>
      <div class="pet-dead">
        <p>注销: <span>2024/9/9</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">银龙</div>
      <div class="pet-times">
        <p>编码: <span>2024/4/07</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">七彩阿莲卡</div>
      <div class="pet-times">
        <p>编码: <span>2024/5/10</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">七彩红松</div>
      <div class="pet-times">
        <p>编码: <span>2024/7/10</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card dead">
    <div class="card-content">
      <div class="pet-name">天使</div>
      <div class="pet-times">
        <p>编码: <span>2023/11/05</span>-<em></em></p>
      </div>
      <div class="pet-dead">
        <p>注销: <span>2024/9/9</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">红鲤</div>
      <div class="pet-times">
        <p>编码: <span>2024/4/10</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">单顶</div>
      <div class="pet-times">
        <p>编码: <span>2024/5/18</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">古典昭和</div>
      <div class="pet-times">
        <p>编码: <span>2024/9/03</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">金狐</div>
      <div class="pet-times">
        <p>编码: <span>2024/9/14</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">银狐</div>
      <div class="pet-times">
        <p>编码: <span>2024/9/14</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">错甲</div>
      <div class="pet-times">
        <p>编码: <span>2024/6/12</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">甜甜圈</div>
      <div class="pet-times">
        <p>编码: <span>2024/6/15</span>-<em></em></p>
      </div>
    </div>
  </li>
  <li class="card">
    <div class="card-content">
      <div class="pet-name">南石</div>
      <div class="pet-times">
        <p>编码: <span>2024/6/15</span>-<em></em></p>
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
