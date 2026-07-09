import { Event } from '../../../shared/types/interfaces/truspace';
import { eventsIpfsRepository } from '../infrastructure/events-ipfs.repository';

export async function getEventsByWorkspaceId(workspaceId: string): Promise<Event[]> {
  return eventsIpfsRepository.getEventsByWorkspaceId(workspaceId);
}
