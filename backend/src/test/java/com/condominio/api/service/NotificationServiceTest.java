package com.condominio.api.service;

import com.condominio.api.exception.ResourceNotFoundException;
import com.condominio.api.model.Notification;
import com.condominio.api.repository.NotificationRepository;
import com.condominio.api.repository.StaffRepository;
import com.condominio.api.model.Staff;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationServiceTest {
    private final NotificationRepository repository = mock(NotificationRepository.class);
    private final StaffRepository staffRepository = mock(StaffRepository.class);
    private final NotificationService service = new NotificationService(repository, staffRepository);
    private final Staff administrator = Staff.builder()
        .idStaff(UUID.randomUUID())
        .username("admin")
        .activo(true)
        .rolSistema("admin")
        .build();

    @Test
    void listingReturnsRecentNotificationsAndTotalUnreadCount() {
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setType("READING_REGISTERED");
        notification.setTitle("Nueva lectura");
        notification.setMessage("Casa 12");
        notification.setTargetPath("/admin");
        notification.setCreatedAt(LocalDateTime.now());
        when(repository.findTop50ByRecipient_UsernameIgnoreCaseOrderByCreatedAtDesc("admin"))
            .thenReturn(java.util.List.of(notification));
        when(repository.countByRecipient_UsernameIgnoreCaseAndReadAtIsNull("admin")).thenReturn(3L);

        var feed = service.listRecent("admin");

        assertEquals(3L, feed.unreadCount());
        assertEquals(1, feed.notifications().size());
        assertFalse(feed.notifications().get(0).read());
    }

    @Test
    void markingReadPersistsTimestampAndIsIdempotent() {
        UUID id = UUID.randomUUID();
        Notification notification = new Notification();
        notification.setId(id);
        notification.setRecipient(administrator);
        when(repository.findByIdAndRecipient_UsernameIgnoreCase(id, "admin")).thenReturn(Optional.of(notification));

        service.markRead(id, "admin");
        service.markRead(id, "admin");

        assertTrue(notification.getReadAt() != null);
        verify(repository).save(notification);
    }

    @Test
    void markingUnknownNotificationFailsExplicitly() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndRecipient_UsernameIgnoreCase(id, "admin")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.markRead(id, "admin"));
        verify(repository, never()).save(any(Notification.class));
    }

    @Test
    void markingAllReadUsesBulkUpdate() {
        service.markAllRead("admin");

        verify(repository).markAllRead(org.mockito.ArgumentMatchers.eq("admin"), any(LocalDateTime.class));
    }

    @Test
    void createsSeparateNotificationForEachActiveAdministrator() {
        Staff secondAdmin = Staff.builder().idStaff(UUID.randomUUID()).username("admin-two").build();
        when(staffRepository.findActiveAdministrators()).thenReturn(java.util.List.of(administrator, secondAdmin));

        service.create("TEST", "Title", "Message", "/admin");

        var captor = org.mockito.ArgumentCaptor.forClass(Notification.class);
        verify(repository, org.mockito.Mockito.times(2)).save(captor.capture());
        assertEquals(administrator, captor.getAllValues().get(0).getRecipient());
        assertEquals(secondAdmin, captor.getAllValues().get(1).getRecipient());
    }
}
