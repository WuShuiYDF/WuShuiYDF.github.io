---
title: '01规划巧解灵魂伴侣配对'
date: '2024-08-10T21:14:07'
tags: ['OR', '运筹学', '线性规划', '依恋类型', 'MBTI']
category: 'OR'
summary: '本文将从运筹学中线性规划的角度来剖析求解如何为活动参与者配对最佳Soulmate。'
cover: 'https://s2.loli.net/2024/08/11/nsD7GefaiWv3xMz.png'
source: 'local'
---

# 前言
Hello呀，今天是2024年的七夕节啦，先给大家看个乐子啦！

![乐子](https://s2.loli.net/2024/08/11/zGD2mrynPqJiBZd.jpg)

主动都是小丑，哈哈！（其实是作者本人在强颜欢笑

伤心的我赶紧去单曲循环了我最喜欢的**棱镜乐队**的<img src="https://s2.loli.net/2024/08/11/2NPlsAjD5EeVZpG.jpg" width="200" style="vertical-align:text-bottom;" alt="" />

> 从前我的另一边，  
> 通往凌晨的街，  
> 空无一人的世界，  
> 行影匆匆这些年。  
>
> 期望从未破灭，  
> 默不作响的时间，  
> 最好的人注定会到身边，  
> 孤注一掷的执念。  
>
> 我终将看到你身影逆光出现，  
> 等这一切，都被你了解，  
> 十指错落相牵。  
>
> 跨越时间，再没有分别，  
> 携手走过明天。


所以在遇到正确的人之前，咱们还是努力学习吧，**Fighting！！！**
# Soulmate配对
## 背景引入
这次七夕闲来无事小范围做了一个灵魂伴侣配对的活动，旨在帮同学们在七夕遇见自己的**Soulmate灵魂伴侣**，具体活动流程如下：

![活动流程](https://s2.loli.net/2024/08/11/6KaSRTUdNBo1nfO.png)

流程很好理解，关键在于这里的**算法匹配**，具体应该如何操作，才能让配对的两人最为合适，也让彼此更能在活动中收获好的体验呢？

我们接下来逐步对这一问题进行分析

## 信息收集
本次报名时除了收集个人基础信息以外，仅额外收集统计了两个方面：
* 个人的MBTI人格类型
* 个人的依恋类型（基于“成人依恋量表（AAS）自测量表”）

最终收集处理过的数据如下（部分展示）：

![数据](https://s2.loli.net/2024/08/11/1SDcGlehjiZW2VP.png)


## 理论基础
在前面的文章中，我通过实证分析（详见[“影响建立亲密关系的要素分析”](https://example.com)）确认了对于建立亲密关系的关键影响因素有：

* 外向型（E）与内向型（I）
* 感觉型（S）与直觉型（N）
* 思维型（T）与情感型（F）
  
同样我们从依恋类型理论出发同样考虑**依恋类型**互相作用下对于亲密关系建立同样会产生影响，因此将依恋类型也纳入考虑因素：

* 四种依恋类型（安全型、焦虑型、回避型、恐惧型）

另外基于个人意愿我们还尊重并且考虑个人性取向问题，因此将性别也纳入考虑因素：

* 性别（男女）

## 得分矩阵
首先我们基于要素（均为分类变量）互相之间的配对方式不同，建立得分矩阵，用于更好地评价不同类型配对下的得分情况：
### 1. 外向（E）与内向（I）  

|        | E      | I      |  
|:------:|:------:|:------:|  
| **E**  | 5      | 4      |  
| **I**  | 4      | 5      |  

### 2. 感觉（S）与直觉（N）  

|        | S      | N      |  
|:------:|:------:|:------:| 
| **S**  | 5      | 3      |  
| **N**  | 3      | 5      |  

### 3. 思维（T）与情感（F）  

|        | T      | F      |  
|:------:|:------:|:------:| 
| **T**  | 5      | 3      |  
| **F**  | 3      | 5      |  

#### 矩阵说明：  
- **外向（E）与内向（I）**：外向型与内向型能够互补，通常得分较高。  
- **感觉（S）与直觉（N）**：感觉型在细节上表现较好，密切工作时得分较高，但直觉型在创新和未来视角方面得分较高。  
- **思维（T）与情感（F）**：思维型在逻辑决策和分析能力上得分高，情感型在理解和同理心上得分高。 

### 4. 基于四种依恋类型的配对矩阵  

|         | 安全型 | 焦虑型 | 回避型 | 恐惧型|  
|:------:|:------:|:------:|:------:|:------:|
| **安全型** | 10     | 8      | 7      | 6      |  
| **焦虑型** | 8      | 6      | 3      | 4      |  
| **回避型** | 7      | 3      | 4      | 3      |  
| **恐惧型** | 6      | 4      | 3      | 2      |  

#### 矩阵解释：  
- **安全型与安全型**：相互理解和支持，最优的配对。  
- **安全型与焦虑型**：安全型能够给焦虑型提供支持，焦虑型也能享受到安全感。  
- **安全型与回避型**：安全型能理解回避型的需求，但可能会感觉到距离感。  
- **焦虑型与焦虑型**：可能互相吸引，但会因为过度焦虑而产生冲突。  
- **回避型与回避型**：虽然相对舒适，但情感交流不足，可能导致关系冷淡。  
- **恐惧型**：由于其不稳定性，通常难以与其他类型建立健康的关系。 

### 5.男女配对的得分矩阵  

|         | 男性 | 女性 |  
|:------:|:------:|:------:| 
| **男性** | -10    | 10   |  
| **女性** | 10   | -10    |  

#### 矩阵解释：  
- **男性与女性**：完美的配对，得分10。  
- **男性与男性**：要避免的配对，得分-10。  
- **女性与女性**：要避免的配对，得分-10。

## 配对算法
考虑到最终的分配为一个配对问题

**我们将主要采用01线性规划来建模这一配对问题**

首先我们定义$X_{ij}$作为我们的决策变量，$X_{ij}$是一个0，1变量，当且仅当参与者$i$与参与者$j$配对时，$X_{ij}$为1，否则为0。

其中$i, j$分别代表参与者编号,所以 $i, j$ 只能取自总人数 $n$ 里面，可以表达为：

$$i, j \in \{1, 2, \ldots, n\}$$


### 约束条件

根据活动定义，显然我们得到了三个约束条件：

#### 1. 每个参与者只能配对一次

$$\sum_{j} X_{ij} = 1 \quad \forall i$$

#### 2. 每个参与者只能被配对一次

$$\sum_{i} X_{ij} = 1 \quad \forall j$$

#### 3. 每次配对都是互相确定的

$$X_{ij} = X_{ji} \quad \forall i, j$$
### 配对得分矩阵
依照前面的得分矩阵，我们可以构建五个$n*n$的配对得分矩阵：

$EI_{ij}$、$SN_{ij}$、$TF_{ij}$、$AS_{ij}$、$G_{ij}$

分别代表外向内向、感觉直觉、思维情感、依恋类型和性别维度下的不同参与者配对后对应的配对得分矩阵。

>例如：
>$EI_{ij}$代表参与者$i$与参与者$j$的配对的外向内向得分
>$SN_{ij}$代表参与者$i$与参与者$j$的感觉直觉得分，以此类推。

因此我们同样可以考虑将这五个配对得分矩阵相加，得到一个综合配对得分矩阵：
$$All_{ij} = EI_{ij} + SN_{ij} + TF_{ij} + AS_{ij} + G_{ij}$$
### 目标函数
有了综合配对得分矩阵，当$X_{ij}$与$All_{ij}$相乘后，我们便可以得到每个配对对应的得分情况。

因此我们便可以写出我们的目标函数：
$$\max \sum_{i, j} All_{ij} X_{ij}$$
也可以将其写成：
$$\max \sum_{i, j} (E_{ij} + S_{ij} + N_{ij} + A_{ij} + G_{ij}) X_{ij}$$

其中$EI_{ij}$、$SN_{ij}$、$TF_{ij}$、$AS_{ij}$、$G_{ij}$分别代表外向内向、感觉直觉、思维情感、依恋类型和性别的得分矩阵。

### 模型总览
综上所述，我们便可以构建出我们的配对模型：
$$
\begin{aligned}
\max \quad & \sum_{i, j} (E_{ij} + S_{ij} + N_{ij} + A_{ij} + G_{ij}) X_{ij} \\
\text{s.t.} \quad & \sum_{j} X_{ij} = 1 \quad \forall i \\
& \sum_{i} X_{ij} = 1 \quad \forall j \\
& X_{ij} = X_{ji} \quad \forall i, j \\&
X_{ij} \in \{0, 1\} \quad \forall i, j
\end{aligned}
$$
### 配对效果
![配对效果](https://s2.loli.net/2024/08/11/kEJiUuoMOrh8IHf.png)
## 源代码
构建完模型后我们便可以进入我们编程的时间啦！

在代码的选择上我还是首选**Python**，因为Python的语法简洁，并且有许多优秀的库可以供我们使用。

### 数据处理
```python
import pandas as pd  

# 步骤 1: 读取 Excel 文件  
file_path = 'input.xlsx'  
df = pd.read_excel(file_path)  

# 步骤 2: 进行反向计分  
columns_to_reverse_score = [1, 6, 7, 12, 15, 16, 17]  # 注意：索引从0开始  
for col in columns_to_reverse_score:  
    df.iloc[:, col] = 6 - df.iloc[:, col]  

# 步骤 3: 计算各个分数并添加到 DataFrame  
closeness_columns = [0, 5, 7, 11, 12, 16]  # 亲近分  
dependency_columns = [1, 4, 6, 13, 15, 17]  # 依赖分  
anxiety_columns = [2, 3, 8, 9, 10, 14]  # 焦虑分  

df['亲近分'] = df.iloc[:, closeness_columns].mean(axis=1)  
df['依赖分'] = df.iloc[:, dependency_columns].mean(axis=1)  
df['焦虑分'] = df.iloc[:, anxiety_columns].mean(axis=1)  

# 步骤 4: 计算亲近依赖均分  
df['亲近依赖均分'] = (df['亲近分'] + df['依赖分']) / 2  

# 步骤 5: 根据均分值判断类型  
def categorize(row):  
    if row['亲近依赖均分'] >= 3 and row['焦虑分'] < 3:  
        return '安全型'  
    elif row['亲近依赖均分'] >= 3 and row['焦虑分'] >= 3:  
        return '焦虑型'  
    elif row['亲近依赖均分'] < 3 and row['焦虑分'] < 3:  
        return '回避型'  
    elif row['亲近依赖均分'] < 3 and row['焦虑分'] >= 3:  
        return '恐惧型'  
    else:  
        return '出现抽象哥了'  # 处理未涵盖的情况  

df['依恋类型'] = df.apply(categorize, axis=1)  

# 步骤 6: 保存处理后的数据  
output_file_path = 'output_file.xlsx'  # 要保存的文件名  
df.to_excel(output_file_path, index=False)  

print("计算完成，亲近分、依赖分、焦虑分、亲近依赖均分和类型已添加并保存到", output_file_path)
```
### 模型求解
这里讲一个小插曲，在第一开始，作者本人是按照使用**Gurobi求解器**的方式来写我的代码,因为它的速度很快，并且我经常使用它来求解OR方面的问题，但抽象的是我发现我的许可证到期了：
![Gurobi](https://s2.loli.net/2024/08/11/V1RojtmBOyDzUKX.png)
于是我又直接安装了**Pulp库**，并又写了一版代码是直接调用里面的函数来进行求解，因此这里的源代码我有两个版本，一个是使用Gurobi的，另一个是使用Pulp的。

#### 使用Gurobi
```python
import numpy as np  
import gurobipy as gp  
from gurobipy import GRB  

import pandas as pd  

# 读取Excel文件
file_path = '1.xlsx' 
df = pd.read_excel(file_path, nrows=10)
print(df)

individuals = df['你的姓名'].values.tolist()  # 个体列表  
ei_types = df["E（外倾）/ I（内倾）"].values.tolist()  
sn_types = df["S（感觉）/ N（直觉）"].values.tolist()  
tf_types = df["T（思维）/ F(情感）"].values.tolist()  
self_types = df["依恋类型"].values.tolist()  
gender = df['您的性别'].values.tolist()  

# 1. 外向型与内向型得分字典  
extraversion_introversion_scores = {  
    ('E', 'E'): 5,  
    ('I', 'I'): 5,  
    ('E', 'I'): 4,  
    ('I', 'E'): 4  
}  

# 2. 感觉型与直觉型得分字典  
sensing_intuition_scores = {  
    ('S', 'S'): 5,  
    ('N', 'N'): 5,  
    ('S', 'N'): 3,  
    ('N', 'S'): 3  
}  

# 3. 思维型与情感型得分字典  
thinking_feeling_scores = {  
    ('T', 'T'): 5,  
    ('F', 'F'): 5,  
    ('T', 'F'): 3,  
    ('F', 'T'): 3  
}  

# 4. 基于四种依恋类型的配对矩阵  
attachment_scores = {  
    ('安全型', '安全型'): 10,  
    ('安全型', '焦虑型'): 8,  
    ('安全型', '回避型'): 7,  
    ('安全型', '混乱型'): 6,  
    ('焦虑型', '安全型'): 8,  
    ('焦虑型', '焦虑型'): 6,  
    ('焦虑型', '回避型'): 3,  
    ('焦虑型', '混乱型'): 4,  
    ('回避型', '安全型'): 7,  
    ('回避型', '焦虑型'): 3,  
    ('回避型', '回避型'): 4,  
    ('回避型', '混乱型'): 3,  
    ('恐惧型', '安全型'): 6,  
    ('恐惧型', '焦虑型'): 4,  
    ('恐惧型', '回避型'): 3,  
    ('恐惧型', '混乱型'): 2,  
}  

# 5. 男女配对得分字典  
gender_matching_scores = {  
    ('男', '男'): 0,  
    ('女', '女'): 0,  
    ('男', '女'): 10,  
    ('女', '男'): 10  
}  

# 创建 Gurobi 模型  
model = gp.Model("Pairing")  

# 创建决策变量  
pairs = {}  
for i in range(len(individuals)):  
    for j in range(len(individuals)):  
        if i != j:  # 确保不配对自己  
            pairs[(i, j)] = model.addVar(vtype=GRB.BINARY, name=f"pair_{i}_{j}") 
 

# 目标函数：最大化配对得分  
model.setObjective(  
    gp.quicksum(  
        ((extraversion_introversion_scores[(ei_types[i], ei_types[j])] +sensing_intuition_scores[(sn_types[i], sn_types[j])] + thinking_feeling_scores[(tf_types[i], tf_types[j])] + attachment_scores[(self_types[i], self_types[j])] + gender_matching_scores[(gender[i], gender[j])]) * pairs[(i, j)])  
        for i in range(len(individuals))  
        for j in range(len(individuals))  
        if i != j  
    ),  
    GRB.MAXIMIZE  
)   

# 确保每个个体只能被配对一次  
for i in range(len(individuals)):  
    model.addConstr(gp.quicksum(pairs[(i, j)] for j in range(len(individuals)) if j != i) <= 1)  # 每个个体只能匹配一次  
    model.addConstr(gp.quicksum(pairs[(j, i)] for j in range(len(individuals)) if j != i) <= 1)  # 每个个体只能被匹配一次  

# 添加对称约束：x_ij = x_ji  
for i in range(len(individuals)):  
    for j in range(i + 1, len(individuals)):  
        model.addConstr(pairs[(i, j)] == pairs[(j, i)])   

# 解决模型  
model.optimize()  

# 输出结果  
if model.status == GRB.OPTIMAL:  
    for i in range(len(individuals)):  
        for j in range(len(individuals)):  
            if i != j and pairs[(i, j)].x > 0.5:  
                print(f"{[i+1]} 的 {individuals[i]} 和{[j+1]} 的 {individuals[j]} 配对")       
```
#### 使用Pulp
```python
import pandas as pd  
from pulp import LpProblem, LpVariable, lpSum, LpBinary, LpMaximize, LpStatus, value  

# 读取Excel文件  
file_path = 'input.xlsx'   
df = pd.read_excel(file_path)  


individuals = df['你的姓名'].values.tolist()  
ei_types = df["E（外倾）/ I（内倾）"].values.tolist()  
sn_types = df["S（感觉）/ N（直觉）"].values.tolist()  
tf_types = df["T（思维）/ F(情感）"].values.tolist()
pj_types = df["J（判断）/ P（知觉）"].values.tolist()
self_types = df["依恋类型"].values.tolist()  
gender = df['您的性别'].values.tolist()  
qq = df['qq'].values.tolist()
xp = df['xp'].values.tolist()

# 定义得分字典  
# 1. 外向型与内向型得分字典  
extraversion_introversion_scores = {  
    ('E', 'E'): 5,  
    ('I', 'I'): 5,  
    ('E', 'I'): 4,  
    ('I', 'E'): 4  
}  

# 2. 感觉型与直觉型得分字典  
sensing_intuition_scores = {  
    ('S', 'S'): 5,  
    ('N', 'N'): 5,  
    ('S', 'N'): 3,  
    ('N', 'S'): 3  
}  

# 3. 思维型与情感型得分字典  
thinking_feeling_scores = {  
    ('T', 'T'): 5,  
    ('F', 'F'): 5,  
    ('T', 'F'): 3,  
    ('F', 'T'): 3  
}  

# 4. 基于四种依恋类型的配对矩阵  
attachment_scores = {  
    ('安全型', '安全型'): 10,  
    ('安全型', '痴迷型'): 8,  
    ('安全型', '回避型'): 7,  
    ('安全型', '恐惧型'): 6,  
    ('痴迷型', '安全型'): 8,  
    ('痴迷型', '痴迷型'): 6,  
    ('痴迷型', '回避型'): 3,  
    ('痴迷型', '恐惧型'): 4,  
    ('回避型', '安全型'): 7,  
    ('回避型', '痴迷型'): 3,  
    ('回避型', '回避型'): 4,  
    ('回避型', '恐惧型'): 3,  
    ('恐惧型', '安全型'): 6,  
    ('恐惧型', '痴迷型'): 4,  
    ('恐惧型', '回避型'): 3,  
    ('恐惧型', '恐惧型'): 2,  
}  

# 5. 男女配对得分字典  
gender_matching_scores = {  
    ('男', '男'): -10,  
    ('女', '女'): -10,  
    ('男', '女'): 10,  
    ('女', '男'): 10  
}  


# 创建模型  
model = LpProblem("Pairing", LpMaximize)  

# 创建决策变量  
pairs = LpVariable.dicts("pair", (range(len(individuals)), range(len(individuals))), 0, 1, LpBinary)  

# 目标函数  
model += lpSum((extraversion_introversion_scores[(ei_types[i], ei_types[j])] +  
                 sensing_intuition_scores[(sn_types[i], sn_types[j])] +  
                 thinking_feeling_scores[(tf_types[i], tf_types[j])] +  
                 attachment_scores[(self_types[i], self_types[j])] +  
                 gender_matching_scores[(gender[i], gender[j])]) * pairs[i][j]  
               for i in range(len(individuals))   
               for j in range(len(individuals))   
               if i != j)  

# 添加约束：每个人只能配对一次  
for i in range(len(individuals)):  
    model += lpSum(pairs[i][j] for j in range(len(individuals)) if j != i) <= 1  
    model += lpSum(pairs[j][i] for j in range(len(individuals)) if j != i) <= 1  

# 添加对称约束：x_ij = x_ji  
for i in range(len(individuals)):  
    for j in range(i + 1, len(individuals)):  
        model += pairs[i][j] == pairs[j][i]  

# 求解模型  
model.solve()  

# 输出结果  
for i in range(len(individuals)):  
    for j in range(len(individuals)):  
        if i != j and value(pairs[i][j]) == 1 :  
            print(f"{i+1} 的 {individuals[i]} 和{j+1} 的 {individuals[j]} 相配")  

# 存储结果
pairing_results = []  
for i in range(len(individuals)):  
    for j in range(len(individuals)):  
        if i != j and value(pairs[i][j]) > 0.5:  
            pairing_results.append((  
                i + 1,  # 第一位的编号  
                individuals[i],   
                self_types[i],   
                "".join([ei_types[i], sn_types[i], tf_types[i], pj_types[i]]),   
                gender[i],  
                xp[j],  
                qq[i],  
                "配对",  
                qq[j],  
                xp[i],  
                gender[j],  
                "".join([ei_types[j], sn_types[j], tf_types[j], pj_types[j]]),      
                self_types[j],   
                individuals[j],  
                j + 1  # 第二位的编号  
            ))   

# 去重，确保序号只出现一次  
unique_pairing_results = []  
seen_ids = set()  

for result in pairing_results:  
    id1 = result[0] 
    id2 = result[-1]
     
    if id1 not in seen_ids and id2 not in seen_ids:  
        unique_pairing_results.append(result)  
        seen_ids.add(id1)  
        seen_ids.add(id2)  


df = pd.DataFrame(unique_pairing_results, columns=[  
    '编号', '姓名', '依恋类型', 'MBTI', '性别',   
    'xp', 'qq', '关系', 'qq', 'xp',   
    '性别', 'MBTI', '依恋类型', '姓名', '编号'  
])  

  
print(df)  

# 存储到 Excel 文件  
df.to_excel('result.xlsx', index=False, sheet_name='配对结果')
```

## 补充
### 成人依恋量表（AAS）自测量表
为什么源代码里面有一段数据处理的代码呢。因为我是直接将**成人依恋量表（AAS）自测量表**直接嵌入到我们信息收集的问卷里面的，因此我们需要进行一下数据处理，来判断一下其具体的依恋类型。

下面是**成人依恋量表（AAS）自测量表**的全部内容：
![](https://s2.loli.net/2024/08/11/wWIs5l42tD1i8UO.webp)
![](https://s2.loli.net/2024/08/11/Gc1WsuoCK8j9S3A.webp)
安全型：亲近依赖均分>3，且焦虑均分<3

焦虑型：亲近依赖均分>3，且焦虑均分>3

回避型：亲近依赖均分<3，且焦虑均分<3

恐惧型：亲近依赖均分<3，且焦虑均分>3
### MBTI
对于MBTI，我直接使用的是MBTI的中文版网站，让报名参与者自测，链接如下：

[https://mbti-16personalities.com](https://mbti-16personalities.com/)
# 结语
>  爱情无药可医,唯有爱得更深。 
>
>——梭罗 《瓦尔登湖》

配对的任务就这样完成了，逻辑基本是科学的客观的且完善的。

但基于算法的配对找到的真的就一定是你的灵魂伴侣，甚至后面会建立爱情关系吗？

我也不知道哈哈，谁又能知道呢？

最后，今天是七夕节啦，祝大家七夕快乐，有情人终成眷属！单身狗的就祝你们早日找到心仪的另一半！
![](https://s2.loli.net/2024/08/11/gFnkNvchuofBzT3.jpg)
**最后的最后，放一只章若楠宝宝的照片！**
