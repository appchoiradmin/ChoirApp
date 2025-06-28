using FluentResults;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities;

public enum UserRole
{
    General,
    ChoirAdmin,
    SuperAdmin
}

[Table("Users")]
public class User
{
    [Key]
    [Column("user_id")]
    public Guid UserId { get; private set; }

    [Required]
    [Column("google_id")]
    public string GoogleId { get; private set; }

    [Required]
    [Column("name")]
    public string Name { get; private set; }

    [Required]
    [Column("email")]
    public string Email { get; private set; }

    [Required]
    [Column("role")]
    public UserRole Role { get; private set; }

    [Required]
    [Column("has_completed_onboarding")]
    public bool HasCompletedOnboarding { get; private set; }

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; private set; }

    public ICollection<Choir> AdminOfChoirs { get; private set; } = new List<Choir>();
    public ICollection<ChoirSongVersion> EditedSongs { get; private set; } = new List<ChoirSongVersion>();
    public ICollection<UserChoir> UserChoirs { get; private set; } = new List<UserChoir>();

    // For EF Core
    private User()
    {
        GoogleId = string.Empty;
        Name = string.Empty;
        Email = string.Empty;
        CreatedAt = DateTime.UtcNow;
    }

    private User(string googleId, string name, string email)
    {
        UserId = Guid.NewGuid();
        GoogleId = googleId;
        Name = name;
        Email = email;
        Role = UserRole.General; // Default role
        HasCompletedOnboarding = false; // New users haven't completed onboarding
        CreatedAt = DateTime.UtcNow;
    }

    public static Result<User> Create(string googleId, string name, string email)
    {
        if (string.IsNullOrWhiteSpace(googleId))
        {
            return Result.Fail("Google ID is required.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return Result.Fail("User name is required.");
        }

        if (string.IsNullOrWhiteSpace(email) || !new EmailAddressAttribute().IsValid(email))
        {
            return Result.Fail("A valid email is required.");
        }

        var user = new User(googleId, name, email);
        return Result.Ok(user);
    }
    
    public void PromoteToAdmin()
    {
        if(Role == UserRole.General)
            Role = UserRole.ChoirAdmin;
    }

    public void DemoteToGeneral()
    {
        if(Role == UserRole.ChoirAdmin)
            Role = UserRole.General;
    }

    public void CompleteOnboarding()
    {
        HasCompletedOnboarding = true;
    }

    public bool IsNewUser()
    {
        return !HasCompletedOnboarding;
    }
}
