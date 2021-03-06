layout: '[post]'
title: 单线程JS实现异步操作的原理
date: 2016-10-11 19:52:24
tags:
  - 运行机制
  - 单线程
  - 异步
categories: "基础知识"
---
我们都知道`javascript`是典型的单线程执行环境，也就是说在同一时刻，只有一段代码可以执行，如果这段代码执行过程中出现阻塞，那么程序就停在这里，无法继续下去。
表现在用户这里，就是浏览器出现假死，无法响应操作，于是出现了异步操作，那么单线程的`JS`是怎么实现异步操作的呢？
其实异步是对于一整个流程来说的，比如在浏览器下运行时的JS，或者是在Node环境下运行的JS，对于JS的代码执行来说，不存在异步的情况。
下面就让我们来看看所谓JS异步操作的真面目。
在理解这个过程之前，我们需要先理解几个概念。
<!--more-->
# 1：JS运行时的线程
我们一直说JS是单线程的语言，这里更确切的说是执行JS代码的JS引擎是单线程，但是在实际的使用环境中，还有由宿主环境提供的一些线程，比如在浏览器中有`DOM`操作相关的线程、处理`AJAX`请求的相关线程、定时器线程，在Node中有文件读取相关的线程等。这里我们统称为工作线程，而执行JS代码的线程我们称之为主线程。

# 2：同步和异步的区别
 
> 同步就是一次只能执行一个任务，只有当前任务结束了才可以继续执行下一个任务，异步就是在执行一个需要花费很长时间的任务时，在具体工作的时间里，可以继续执行下一个任务，当之前的任务执行完成时，继续需要执行的部分。
>
 
这里以AJAX请求为例，举个例子：

异步的AJAX：
> 
* 主线程：“你好，AJAX线程。请你帮我发个HTTP请求吧，我把请求地址和参数都给你了。”
* AJAX线程：“好的，主线程。我马上去发，但可能要花点儿时间呢，你可以先去忙别的。”
* 主线程：：“谢谢，你拿到响应后告诉我一声啊。”
(接着，主线程做其他事情去了。一顿饭的时间后，它收到了响应到达的通知。)
>

而对于同步的AJAX则是这种情况：

同步的AJAX：
> 
* 主线程：“你好，AJAX线程。请你帮我发个HTTP请求吧，我把请求地址和参数都给你了。”
* AJAX线程：“......”
* 主线程：：“喂，AJAX线程，你怎么不说话？”
* AJAX线程：“......”
* 主线程：：“喂！喂喂喂！”
* AJAX线程：“......”(一炷香的时间后)
* 主线程：：“喂！求你说句话吧！”
* AJAX线程：“主线程，不好意思，我在工作的时候不能说话。你的请求已经发完了，拿到响应数据了，给你。”
>

大家可以很直观的看到，同步的AJAX在请求的时候，有一段时间是完全失去响应的，但是如果这段时间很长，就会使浏览器长时间的失去响应，用户体验就非常不好了，而异步的操作就不会出现这种问题，在等待请求结果的时候，主线程可以继续执行别的操作，直到有响应了再继续执行之前的任务。

# 3：异步操作的过程
> JS中异步操作其实是主线程执行到异步函数时发起异步操作请求，工作线程接收到请求就会返回请求yi接收的通知（回调发起函数的返回值）给主线程，主线程于是就继续执行其他的操作，在工作线程完成请求之后，就将请求结果返回给主线程，主线程用工作线程请求回来的数据继续执行后续的操作(回调函数)。
>

对于执行JS代码的主线程来说，异步操作其实只有两个过程：
> 1： 异步操作发起函数（注册函数）；
2： 异步结果处理函数（回调函数）；
>

举个例子：
```
setTimeout(fn,1000)
//每隔1000ms执行一次fn函数
```
其中，`setTimeout`是异步操作的发起函数，`fn`即异步结果处理函数，回调函数。
也许很多人还有疑问，每隔`1000ms`执行一次`fn`函数，那么这个计时功能是谁来实现的呢？这无法通过异步来实现，因为计时要求是时刻占用的一个进程。这时候，就需要了解一下JS的消息队列和事件循环了。
# 4：消息队列和事件循环
> 消息队列：消息队列是JS中先进先出，后进后出的队列，里面存放着各种JS需要执行的消息。
事件循环：JS引擎其实就是不断的从消息队列中取消息、执行消息的过程
>

实际上，主线程执行的程序就是来自`消息队列`，当主线程的当前代码执行完毕时，就会去`消息队列`中取消息，执行消息，取消息，直至`消息队列`为空，主线程就进入空闲状态。而取一个消息并执行的过程就叫一个`事件循环`。
这样说的话，消息队列中存放的就是可以执行的代码是吗？这句话对，但是不全对。
实际上，主线程在发起`AJAX`请求后，会继续执行其他代码。`AJAX`线程负责请求，拿到响应后，它会把响应封装成一个`JavaScript对象`，然后构造一条消息：
```
// 消息队列中的消息就长这个样子
var message = function () {
    callbackFn(response);
}
```
`callbackFn`就是异步操作中的结果处理函数。（回调函数）
通过这种方式，达到了异步的目的，但是主线程是单线程并没有改变，所以这句话是对的。
# 5：总结
在`ECMAScript 262`规范中，并没有对异步、事件队列等概念及其实现的描述。这些都是具体的JavaScript运行时环境使用的机制（浏览器、Node等宿主环境提供的）。本文重点是描述异步过程的原理，为了便于理解做了很多简化。所以文中的某些术语的使用可能是不准确的，具体细节也未必是正确的，请大家多思考，有疑问欢迎留言讨论。
参考资料：
[JavaScript：彻底理解同步、异步和事件循环](https://segmentfault.com/a/1190000004322358#articleHeader2)