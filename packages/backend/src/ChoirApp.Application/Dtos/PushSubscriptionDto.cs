using System;

namespace ChoirApp.Application.Dtos
{
    public class CreatePushSubscriptionDto
    {
        public string Endpoint { get; set; } = string.Empty;
        public string P256dhKey { get; set; } = string.Empty;
        public string AuthKey { get; set; } = string.Empty;
    }

    public class PushSubscriptionDto
    {
        public Guid PushSubscriptionId { get; set; }
        public Guid UserId { get; set; }
        public string Endpoint { get; set; } = string.Empty;
        public string P256dhKey { get; set; } = string.Empty;
        public string AuthKey { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class PushNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public string? Badge { get; set; }
        public string? Url { get; set; }
        public object? Data { get; set; }
    }
}
