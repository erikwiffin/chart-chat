import asyncio
from collections import defaultdict
from typing import AsyncGenerator


class PubSub:
    def __init__(self):
        self._subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)

    async def publish(self, channel: str, message):
        for queue in self._subscribers[channel]:
            await queue.put(message)

    async def subscribe(self, channel: str) -> AsyncGenerator:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[channel].append(queue)
        try:
            while True:
                message = await queue.get()
                yield message
        finally:
            self._subscribers[channel].remove(queue)


pubsub = PubSub()
