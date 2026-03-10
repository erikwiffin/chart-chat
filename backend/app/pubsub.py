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


class ProjectPubSub:
    """Thin wrapper that binds a project_id so callers use event names directly."""

    def __init__(self, pubsub: PubSub, project_id: int):
        self._pubsub = pubsub
        self._project_id = project_id

    async def publish(self, event: str, message):
        await self._pubsub.publish(f"{event}:{self._project_id}", message)
