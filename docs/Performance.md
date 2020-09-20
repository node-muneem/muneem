# Performance

Most of the developers calculate the performance (speed) of a framework with static URL returning `{"hello" : "world"}` response without considering network delay and other common processes like logging, monitoring etc. which is not realistic. It can help you to compare the speed of the some frameworks but can't tell you whether this speed is sufficient for your projcet. Moreover, if you are comparing framewors, speed should not be the only reason. If a framework is 2-3 times faster than your need in next 1 year, you should put it on second priority.

Though it is difficult to assume the exact need of a project. I've written a separate repository to calculate the throughput of मुनीम (Muneem) framework for your project.

In benchmark project, I'm including following

* Logging, and monitoring.
* Static, dynamic mixed URLs.
* 50kb average response size
* Netowork delay of 1 sec

Watch this page for more detail.
