using FluentResults;
using System;
using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Domain.Entities
{
    public class PushSubscription
    {
        public Guid PushSubscriptionId { get; private set; }
        public Guid UserId { get; private set; }
        public string Endpoint { get; private set; } = string.Empty;
        public string P256dhKey { get; private set; } = string.Empty;
        public string AuthKey { get; private set; } = string.Empty;
        public DateTime CreatedAt { get; private set; }
        public DateTime? LastUsedAt { get; private set; }
        public bool IsActive { get; private set; }

        // Navigation properties
        public User User { get; private set; } = null!;

        // Private constructor for EF Core
        private PushSubscription() { }

        private PushSubscription(Guid userId, string endpoint, string p256dhKey, string authKey)
        {
            PushSubscriptionId = Guid.NewGuid();
            UserId = userId;
            Endpoint = endpoint;
            P256dhKey = p256dhKey;
            AuthKey = authKey;
            CreatedAt = DateTime.UtcNow;
            IsActive = true;
        }

        public static Result<PushSubscription> Create(Guid userId, string endpoint, string p256dhKey, string authKey)
        {
            if (userId == Guid.Empty)
                return Result.Fail("User ID cannot be empty.");

            if (string.IsNullOrWhiteSpace(endpoint))
                return Result.Fail("Endpoint cannot be empty.");

            if (string.IsNullOrWhiteSpace(p256dhKey))
                return Result.Fail("P256dh key cannot be empty.");

            if (string.IsNullOrWhiteSpace(authKey))
                return Result.Fail("Auth key cannot be empty.");

            return Result.Ok(new PushSubscription(userId, endpoint, p256dhKey, authKey));
        }

        public void MarkAsUsed()
        {
            LastUsedAt = DateTime.UtcNow;
        }

        public void Deactivate()
        {
            IsActive = false;
        }

        public void Reactivate()
        {
            IsActive = true;
        }
    }
}
