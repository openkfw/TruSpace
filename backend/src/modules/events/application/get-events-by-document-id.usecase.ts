import { Event } from '../../../shared/types/interfaces/truspace';
import { eventsIpfsRepository } from '../infrastructure/events-ipfs.repository';

export async function getEventsByDocumentId(documentId: string): Promise<Event[]> {
  return eventsIpfsRepository.getEventsByDocumentId(documentId);
}
