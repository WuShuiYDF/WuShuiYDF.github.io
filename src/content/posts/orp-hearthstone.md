---
title: '炉石传说中最优解场问题'
date: '2024-01-31T08:00:00'
tags: ['OR', '运筹学', '线性规划']
category: 'OR'
summary: '本文将从运筹学中线性规划的角度来剖析炉石传说中最常见的解场问题，并不断优化使之成为一个可以贴合实际情况的最优解。'
cover: 'https://s2.loli.net/2024/02/02/no5sl8IDPGqxS9f.png'
source: 'local'
---

# 欢迎
Welcome to my blog! This is my very first post. 
>~~katex还没有学完，学完后会对文章中的相应公式处进行补全。~~
>
>直接拿下，已全部改为Katex格式

# 主要内容

## 问题阐述

### 背景介绍
#### 游戏简介

![](https://s2.loli.net/2024/02/02/no5sl8IDPGqxS9f.png)
##### 起源

炉石传说（Hearthstone）的起源可追溯至2014年3月13日，当时暴雪娱乐公司推出了这款免费的**策略类**卡牌游戏，支持在Windows、Macintosh系统以及iPad上游玩。作为暴雪旗下的主打游戏，炉石传说在发行初期迅速获得了玩家的喜爱。

游戏的设计理念沿袭了暴雪一贯的“易于上手，难于精通”的特点，使得新玩家可以轻松入门，同时也为深度玩家提供了足够的挑战。炉石传说不仅是一款独立的卡牌游戏，更是暴雪经典《魔兽》系列的延伸，融合了丰富的游戏设定和角色元素。

在游戏中，玩家可以选择九大经典英雄人物之一，建立以其职业为主题的卡牌套牌，并与其他玩家展开激烈的对战。通过胜利，玩家有机会赢取新的卡牌，不断丰富自己的卡牌库，提高战斗策略的多样性。

##### 走向衰落

然而，随着时间的推移，炉石传说在一段时期内逐渐走向衰落。2023年1月24日，网易在中国大陆地区宣布正式停止运营包括《炉石传说》在内的所有暴雪游戏产品，关闭战网登录和游戏服务器，也中断了新玩家的下载途径。这一决定意味着数年来陪伴玩家的炉石传说正式告别中国大陆市场。

更令人意外的是，2023年3月16日，亚奥理事会宣布取消杭州2022年第19届亚运会原定的《炉石传说》比赛项目。这一决定对于原本期待在亚运舞台上展示技艺的炉石传说选手和粉丝来说无疑是一个巨大的打击，标志着这款曾经热门的卡牌游戏在竞技场上的辉煌时刻暂告一段落。

尽管炉石传说在某些地区面临困境，但它仍然在其他地区拥有一定的用户基础，游戏的影响力和魅力仍然在一定程度上存在。未来，炉石传说是否能够重振旗鼓，或者成为游戏历史中的一段美好回忆，都将取决于暴雪和玩家社群的互动与发展。将这两段融合一下，我们可以看到炉石传说在初期的成功和吸引力，但也面临着来自卡牌平衡、竞技环境变化以及设计决策等方面的挑战。特别是在中国大陆市场的退出以及亚运会比赛项目取消的情况下，炉石传说的前景受到了较大的影响。然而，在其他地区，游戏仍然保持一定的用户基础，而玩家社群仍然期待开发者通过更新和改进带来游戏的新生。炉石传说或许将成为游戏史上的一个里程碑，记录着其在玩家心中留下的美好回忆。随着科技和游戏行业的不断发展，我们也将见证更多新的电子竞技作品崛起，为玩家带来更为多样化的游戏体验。

#### 游戏玩法介绍
##### 随从卡牌
![](https://s2.loli.net/2024/02/02/hD7q5N8BpLjilcQ.png)
随从牌无疑是炉石的核心卡类，随从牌由随从的种族，随从基础属性（攻击力与血量还有费用）与随从的效果描述三部分组成，玩家操各种各样的随从在棋盘中选择解场清怪，或是打脸抢血，配合着随从牌的额外效果，使游戏的策略性与可玩性大大提高。

本案例中将主要讨论并单纯只使用攻击力和血量这两个属性。
##### 战斗棋盘
![图片3.png](https://s2.loli.net/2024/02/02/SCgIseBo9lLG74h.png)

1. 英雄和英雄技能：   
* 每个玩家控制一个英雄，英雄具有特定的技能。（不重要）
* 英雄技能可以在每个回合中使用，消耗法力水晶。（不重要）
  
2. 战斗区域：
* 战斗棋盘上有两个英雄区，用于放置双方英雄。（不重要）
* 随从可以被放置在随从区，最多七个位置。（重要）

3. 英雄/玩家生命值：
* 每个玩家有30点生命值，游戏的目标是降低对手的生命值为零。

##### 战斗系统
1. 回合制度：
* 游戏以回合制进行，每个玩家交替进行回合。
* 每个回合分为抽牌阶段、主要阶段、战斗阶段和结束阶段。
2. 攻击和攻击后生命值：(效果可结合下方图片)
* 随从的攻击力表示其每回合可以对敌方造成的伤害，生命值表示其可以承受的伤害。
* 随从可以攻击敌方随从或英雄，也可以不攻击。
3. 随从间互相攻击机制：（如下图所示）
* 一个随从攻击另一个随从后，双方随从生命值分别变为自己生命值减去对方的攻击力。
* 若随从生命值变为0及0以下，则死亡。
* 每个随从一般来说只能攻击一次。

![](https://s2.loli.net/2024/02/02/pKePAq2UWGZIjr6.png)
>如图所示，我方一号随从（2/2）攻击敌方一号随从（7/4），我方随从变为（2/-5），敌方变为（7/2），我方随从死亡。 

### 问题背景分析
#### 面临的问题
在炉石传说中最重要的问题就是解场问题。
解场的重要性体现在以下几个方面：

1. 控制场面： 随从可以提供持续的威胁，解场可以帮助你掌控局势，避免对手建立起强大的板面（Board Presence）。
2. 防止伤害： 对手场上的随从可能具有高攻击力，解场可以避免受到大量伤害，保护你的英雄生命值。
3. 减少对手资源： 解场可能迫使对手消耗更多资源（如法力水晶、卡牌等）来重新建立场面，削弱对手的资源优势。
4. 策略性调整： 通过解场，你可以强化自己的策略，例如在对手场上准备展开更强大的组合或者提高自己下一步行动的效果。

总而言之，在炉石传说中，解场是控制战局的重要手段之一，因为它可以改变场上局势，让玩家更有利地掌握游戏节奏，并为自己赢得胜利创造机会。
因此如何恰当合适的解场以及如何使得解场效果最优，这便转变成了我们的一个最优问题。

#### 目标设定
我们希望设计一种算法，使得玩家在输入当前战斗棋盘中己方和敌方随从的数值以后，帮助我们给出最优的解场方案，这就是我们所希望的。

#### 解决方法
我们可以将该问题视作一道线性规划问题，通过巧妙地设计算法和约束条件并利用python+gurobi相关工具对解场问题得到最优规划。

## 模型建立
### 基本假设
为简化建模过程，作如下假设：
1. 不考虑随从的关键词效果（急只考虑随从身材：攻击力与血量）；
2. 不考虑当前回合数所造成的法力水晶问题；
3. 不考虑能否斩杀对方英雄的问题，仅仅针对于解场；
4. 部分解场还存在于理想环境下，与实际效果可能存在偏差。

### 问题建模
首先我们先来按照游戏规则确定一个约束条件：
>每个随从最多只能攻击1次

设$n$为敌方随从数量

$m$为己方随从数量

$X_{ij}$表示我放随从是否攻击对方第j个随从，显然$X_{ij}$只可取{0，1}

又因为每个随从最多攻击一下或者不攻击，所以有一组约束条件： 

$$\begin{align}
\sum\limits_{k=1}^{n}x_{𝑖𝑘} ≤1
\end{align}$$

然后再来看目标函数，一般解场的最优目标是使得对方的场攻最小。这样的情况是对我们来说最有利的，因此我们的目标函数就可以设定为敌方剩余最终的攻击力之和。

不难列出对于对方的任意一个随从，最终攻击力$f(x)_i$的表达式都可以表示出来设第$i$个随从攻击力为$p_i$：

$$
\begin{align}
f(x)_i = \begin{cases}
   p_i &\text{如果存活}  \\
   0 &\text{如果死亡 } 
\end{cases}
\end{align}$$


但很明显这是一个分段函数，对于我们的线性规划来说，这无疑是很难求解的因此我们要想办法去将这个未知条件线性化。 

#### 关键优化
这里我们很巧妙地想到了使用<span class="hexo-label hexo-label-green">大M法</span>来将分段函数划为两个约束条件。

首先我们先自定义一个变量为$z_i$表示第$i$个随从的存活状态，显然这个变量是一个0，1整数变量。

然后我们考虑一个$M$（取很大值，这里我们只是在做理想化讨论，因此将它视为正无穷），再设一个$D_i$表示这个随从的最终生命值。
$$
\begin{equation}
\begin{align*}
&存活：D_i>0，z_i=1，f(x)_i=p_i\\
&死亡：D_i<=0, z_i=0, f(x)_i=0
\end{align*}
\end{equation}
$$
显然有：$f(x)_i=z_i*p_i$，我们通过设立一个新的变量使得$f(x)$从分段函数变为了一个含一个变量的一般表达式。

此处我们还需要的一步是要建立起$D_i$与$z_i$的联系，便可通过大$M$桥梁。

建立约束条件：
$$
\begin{equation}
\begin{align*}
&D_i-z_i*M<=0（M很大）\\
&\text{if }  D_i>0，z_j \equiv1
\end{align*}
\end{equation}
$$


同理建立另一个约束条件：
$$
\begin{equation}
\begin{align*}
&D_i +（1-z_j）*M>0 （M很大）\\
&\text{if } D_i<=0，z_j\equiv0
\end{align*}
\end{equation}
$$





所以我们对于一个敌方随从的最终场攻我们便用三个式子将它完美地表达了出来：
$$
\begin{equation}
\begin{align*}
&f(x)_i=z_i*p_i\\
&D_i +（1-z_j）*M>0\\ 
&D_i-z_i*M<=0
\end{align*}
\end{equation}
$$



此时便可以轻松写出目标函数： 


$$
\begin{equation}
{\text{Minimize}} \sum\limits_{j=1}^{n}{f(j)}
= {\text{Minimize}} \sum\limits_{j=1}^{n}{z_j*P_j}
\end{equation}
$$

#### 模型建立
**完成了最难地一部分，写出剩下建模地内容便是易如反掌。**

首先列出已知量：

$
N为己方随从数量\\
M为敌方随从数量\\
P_j为敌方第j随从的攻击力\\
Q_j为敌方第j随从的生命值\\
A_i为敌方第i随从的攻击力\\
B_i为敌方第i随从的生命值\\
$

然后写出变量：

$
X_{ij}表示我方第i个随从是否攻击了敌方第j个随从，为0，1变量\\
Y_i表示我方第i个随从是否存活，为0，1变量\\
Z_j表示敌方第j个随从是否存活，为0，1变量\\
$

约束表达式：

$$
\begin{align}
\tag{1}\sum_{k=1}^{n}x_{ik} &\leq 1 & (n \text{ 组约束}) \\
\tag{2}f(j) &= z_j \cdot P_j & (m \text{ 组约束}) \\
\tag{3}Q_j - C_j + (1 - z_j) \cdot M &> 0 & (m \text{ 组约束}) \\
\tag{4}Q_j - C_j - z_j \cdot M &\leq 0 & (m \text{ 组约束}) \\
\tag{5}C_j &= \sum_{k=1}^{n}x_{kj} \cdot A_k & (m \text{ 组约束})
\end{align}
$$
> 表达式解释：
>
>这里的$C_j$表达的是敌方第$j$个随从受到的攻击力总和
>
>$Q_j-C_j$表达的是敌方随从剩余血量

目标函数：

$$
\begin{equation}\tag{1}
{\text{Minimize}} \sum\limits_{j=1}^{n}{f(j)}
= {\text{Minimize}} \sum\limits_{j=1}^{n}{z_j*P_j}
\end{equation}
$$

到此我们的建模就完成了。

## 模型进一步优化
### 进一步发现问题以及分析问题
在我们的求解过程中，通过观察求解器的结果，不难发现每次运行的结果基本上都存在多解。这证明了我们的模型在优化和精准度方面仍有提升的空间。

从实战的角度来理解为什么会出现多解并不困难。在我们前面的模型中，我们主要追求的是使对方场上攻击力最小化的策略。然而，这样的解法往往是一种不计代价的攻击方式，有时我们可能会选择用我们强大的随从去攻击对方相对较弱的随从，类似于田忌赛马的情况。

实际上，我们作为游戏操控者，更希望在战斗或解场之后保留下场上最优秀的一批随从。换句话说，我们希望在解场之后，场上留下来的随从的总价值最大，而不仅仅是追求场上攻击力的最小化。

虽然使场上攻击力最小化可能存在多解，但我们忽略了代价的问题。例如，一些随从可能具有强大的效果，或者通过一换一的方式与敌人交战，浪费了一些攻击力较高的优质随从。因此，我们还需要考虑最小代价的问题。
### 优化方向分析
前面提到了最小代价，因此在新的模型中此时我们需要对每个友方随从引入一个新的函数，价值函数$s（i）$。

我们第二问的方向是在已知最小场攻的情况下，我们要在其中寻找代价最小的解场方案，所以我们可以把第一问的目标函数值作为第二问新的约束条件。

同时目标函数也显而易见：
${\text{Maxmum}} \sum\limits_{i=1}^ms（i）$
### 优化难点
新的优化模型看起来简单，但现在却有一个相当难以解决的问题是价值函数$s（i）$如何确定，它并不像场攻一样是由已知量定死的。反而他却是一个相当主观的一个函数值，每个人的理解习惯不同，对于价值体系的认定也就不同。比如有人认为生命$B_ i$更重要，则$s（i）= B_ i$，又或者是认为攻击更重要，则$s（i）= A_ i* y_i$，又或者存活数量最重要则$s（i）= y_ i$……

这样的结果确实难以确定，甚至同一个人在不同的对局中对于价值的偏好也会随着战局改变。

为了更好地应付这些突发情况，我在代码中我将这几种方案全部列出，并且还提供了自定义价值模式，更加灵活，也使得求解地适用性更广。
### 优化后模型
由于实际代码中使用多种价值函数，此处建模模型为当$s（i）= A_ i*剩余血量$时的模型.

已知量：

$
N为己方随从数量\\
M为敌方随从数量\\
P_j为敌方第j随从的攻击力\\
Q_j为敌方第j随从的生命值\\
A_i为敌方第i随从的攻击力\\
B_i为敌方第i随从的生命值\\
$

然后写出变量：

$
X_{ij}表示我方第i个随从是否攻击了敌方第j个随从，为0，1变量\\
Y_i表示我方第i个随从是否存活，为0，1变量\\
Z_j表示敌方第j个随从是否存活，为0，1变量\\
S_i表示我方第i个随从的价值\\
$

约束表达式：

$$
\begin{align}
\tag{1}\sum_{k=1}^{n}x_{ik} &\leq 1 &  \forall i(1\leq i\leq m)\\
\tag{2}Q_j - C_j + (1 - z_j) \cdot M &> 0 & \forall j(1\leq j\leq n) \\
\tag{3}Q_j - C_j - z_j \cdot M &\leq 0 & \\
\tag{4}C_j &= \sum_{k=1}^{n}x_{kj} \cdot A_k & \\
\tag{5}f(j) &= z_j \cdot P_j & \forall j(1\leq j\leq n) \\
\tag{6}\sum_{j=1}^{n}f(j)&=O_*&(\text{场攻最小约束})\\
\tag{7}B_i-D_i-y_i*M&\leq0&\forall i(1\leq i\leq m)\\
\tag{8}B_i-D_i+(1-y_i)*M&>0\\
\tag{9}0&\leq s_i\\
\tag{10}s_i & \leq y_i*M\\
\tag{11}A_i*(B_i-D_i)-(1-y_i)*M&\leq s_i\\
\tag{12}s_i&\leq A_i*(B_i-D_i)-(1-y_i)*M
\end{align}
$$

>表达式解释：
>
>这里的价值函数很巧和前面的最终攻击力函数一样也是一个要考虑随从存活状态的分段函数，这里我们对其的处理和模型一相似，同样使用<span class="hexo-label hexo-label-green">大M法</span>来进行线性化操作。

目标函数：
${\text{Maxmum}} \sum\limits_{i=1}^ms（i）$

到此我们新的建模也就完成了。
## 源代码
完成建模其实才是解决运筹学问题最重要的一步，至于编程求解更多的只是一个翻译的过程。因此在学习运筹学相关问题时应**重建模，轻编程。**

下面是作者本人求解此模型的代码部分：
``` python
import sys
import gurobipy as gp
import traceback
#大M
var_M = 10000

from gurobipy import GRB, GurobiError
from gurobipy import Env, GRB
from gurobipy import GRB, Model, LinExpr

try:
    model = gp.Model("最优解场")
    model.setParam('OutputFlag', 0)


    # num of friendly
    m = int(input("输入友方随从数量:"))
    # num of enemy
    n = int(input("输入敌方随从数量:"))

    # Atk of friendly
    A = [int(input(f"输入友方第{i+1} 个随从的攻击力: ")) for i in range(0, m )]
    # Hp of friendly
    B = [int(input(f"输入友方第{i+1} 个随从的生命值: ")) for i in range(0, m )]
    # Atk of enemy
    P = [int(input(f"输入敌方第{i+1} 个随从的攻击力: ")) for i in range(0, n )]
    # Hp of enemy
    Q = [int(input(f"输入敌方第{i+1} 个随从的生命值: ")) for i in range(0, n )]

    # Variable initialization
    #攻击方式变量
    x = [[model.addVar(0, 1, 0, GRB.BINARY) for j in range(0, n )] for i in range(0, m )]
    #友方随从存活变量
    y = [model.addVar(0, 1, 0, GRB.BINARY) for i in range(0, m )]
    #敌方随从存活变量
    z = [model.addVar(0, 1, 0, GRB.BINARY) for i in range(0, n )]
    model.update()
    # 敌方挨打伤害总和
    C = [LinExpr(sum(x[i][j] * A[i] for i in range(0, m ))) for j in range(0, n )]
    # 友方挨打伤害总和
    D = [LinExpr(sum(x[i][j] * P[j] for j in range(0, n ))) for i in range(0, m )]


    # 目标函数
    target = LinExpr()
    for i in range(0, n ):
        temp = P[i] * z[i]
        target += temp
    #场攻最小
    model.setObjective(target, GRB.MINIMIZE)


    # 添加约束
    for i in range(0, m ):
        temp = LinExpr()
        for j in range(0, n ):
            temp += x[i][j]
        model.addConstr(temp <= 1)
    #大M法进行操作表示敌方最后的攻击力
    for i in range(0, m ):
        model.addConstr(D[i] + var_M * y[i] >= B[i])
        model.addConstr(D[i] + var_M * y[i] <= B[i] + var_M - 1)

    for j in range(0, n ):
        model.addConstr(C[j] + var_M * z[j] >= Q[j])
        model.addConstr(C[j] + var_M * z[j] <= Q[j] + var_M - 1)
    # 求解模型
    model.optimize()
    O = model.objVal


    # 获取优化结果
    if model.status == GRB.OPTIMAL:
        # 输出最优解
        print("解场方式:")
        for i in range(m):
            for j in range(n):
                if int(x[i][j].X) == 1:
                    print(f"友方[{i+1}]({A[i]}/{B[i]})攻击敌方[{j+1}]({P[j]}/{Q[j]})")
        #存活参量
        print("友方")
        for i in range(0, m ):
            print(f'y[{i}] = {y[i].x}')
        print("敌方")
        for j in range(0, n ):
            print(f'z[{j}] = {z[j].x}')
            
        # 获取最优目标值
        optimal_value = model.objVal
        print(f'最优目标值：{optimal_value}')
        print("\n")

    else:
        raise Exception("无法求最优解。")
    
    #二阶段：进一步优化求解
    #选择模式
    print("你在解场后更在意己方随从的什么价值？")
    print("1.攻击力价值2.站场价值(生命力)3.下回合攻击频率4.自定义价值5.综合考量(攻击力*剩余血量)")
    print("\n")
    way=int(input("请选择你喜爱的方式（输入数字即可）： "))
    #第二部分
    #价值函数
    s = {}
    for i in range(m):
        s[i] = model.addVar(0, GRB.INFINITY, 0, GRB.INTEGER, "s" + str(i))
    target2 = LinExpr()
    if way == 1:
        print("攻击力价值")
        for i in range(0, m ):
            model.addConstr(D[i] + var_M * y[i] >= B[i])
            model.addConstr(D[i] + var_M * y[i] <= B[i] + var_M - 1)
        for i in range(m):
            target2 += A[i]*y[i]
    elif way == 2:
        print("站场价值(生命力)")
        # 在这里添加站场价值板块的代码
        for i in range(m):
            model.addConstr(s[i] - y[i] * var_M <= 0)

        for i in range(m):
            model.addConstr(s[i] + D[i] - y[i] * var_M >= B[i] - var_M)

        for i in range(m):
            model.addConstr(s[i] + D[i] + y[i] * var_M <= B[i] + var_M)

        for i in range(m):
            target2 += s[i]
    elif way == 3:
        print("下回合攻击频率")
        for i in range(0, m ):
            model.addConstr(D[i] + var_M * y[i] >= B[i])
            model.addConstr(D[i] + var_M * y[i] <= B[i] + var_M - 1)
        for i in range(m):
            target2 += y[i]
    elif way == 4:
        print("自定义价值")
        V = [int(input(f"输入友方第{i+1} 个随从的价值: ")) for i in range(0, m )]
        for i in range(m):
            target2 += V[i]*y[i]
    elif way == 5:
        print("综合考量(攻击力*剩余血量)")
          # 同样使用大M法
        for i in range(m):
            model.addConstr(s[i] - y[i] * var_M <= 0)

        for i in range(m):
            model.addConstr(s[i] + A[i] * D[i] - y[i] * var_M >= A[i] * B[i] - var_M)

        for i in range(m):
            model.addConstr(s[i] + A[i] * D[i] + y[i] * var_M <= A[i] * B[i] + var_M)

        for i in range(m):
            target2 += s[i]
    else:
        raise Exception("输入了未知方案")
    
    model.addConstr(target <= O)

    model.setObjective(target2, GRB.MAXIMIZE)

    model.update()
    model.optimize()



    #输出结果
    print("解场方式:")
    for i in range(m):
        for j in range(n):
            if int(x[i][j].X) == 1:
                print(f"友方[{i+1}]({A[i]}/{B[i]})攻击敌方[{j+1}]({P[j]}/{Q[j]})")

    print("死亡的友方随从:")
    for i in range(m):
        if int(y[i].X) == 0:
            print(f"[{i+1}]({A[i]}/{B[i]}) ", end="")
    print()

    print("死亡的敌方随从:")
    for i in range(n):
        if int(z[i].X) == 0:
            print(f"[{i+1}]({P[i]}/{Q[i]}) ", end="")
    print()

    print("解场后:")
    print("敌方:")
    for i in range(n):
        if int(z[i].X) == 1:
            print(f"[{i+1}]({P[i]}/{Q[i]}) ", end="")
    print()

    print("友方:")
    for i in range(m):
        if int(y[i].X) == 1:
            print(f"[{i+1}]({A[i]}/{B[i]}) ", end="")
    print()
    

    print("解场后场上友方随从剩余价值最大值 =", model.objVal)
    print("\n")
    print("相关参数：")
    print("X[i][j]")
    for i in range(m):
        for j in range(n):
            print(int(x[i][j].X), end="")
    print("\n")
    print("Y[i]")
    for i in range(m):
        print(int(y[i].X), end=" ")
    print("\n")
    print("Z[i]")
    for i in range(n):
        print(int(z[i].X), end=" ")

#可能引发的错误
except GurobiError as e:
    print(f"错误代码 = {e.errno}")
    print(e.msg)
    print("错误发生在代码行:", traceback.extract_tb(sys.exc_info()[2])[-1][1])

except Exception as e:
    print("优化过程中发生异常:", str(e))
    print("错误发生在代码行:", traceback.extract_tb(sys.exc_info()[2])[-1][1])


```
# 致谢
最后本文建模的大部分思路均参考于 [[Manim]将炉石传说中的“解场”问题转化为线性规划问题](https://player.bilibili.com/player.html?aid=705259497&bvid=BV1EQ4y1H76G&cid=1317475951&p=1)
>此作者的视频都很有意思，还有一篇 [浅谈鬼灵计算器的dfs实现](https://player.bilibili.com/player.html?aid=948764466&bvid=BV1ws4y1W7Vo&cid=993042700&p=1)，推荐观看

视频给了我很大的提示，本文算是对于该视频模型的一个复现加上一点自己的思路。

本人也是刚学完运筹学不久，这次的运筹学实践刚好又能涉足自己最喜欢的游戏领域，算是有一点点小小的成就感吧。

另外这也是我的第一篇博客，如有错误，还请各位大佬不吝赐教。

**最后的最后，** <span class="hexo-label hexo-label-pink">本是青灯不归客</span>，<span class="hexo-label hexo-label-pink">却因浊酒留风尘</span>，<span class="hexo-label hexo-label-pink">星光不问赶路人</span>，<span class="hexo-label hexo-label-pink">岁月不负有心人</span>**，愿诸君共勉，前程似锦。**
