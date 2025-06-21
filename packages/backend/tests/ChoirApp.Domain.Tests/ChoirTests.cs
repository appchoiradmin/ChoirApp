using ChoirApp.Domain.Entities;
using FluentAssertions;
using FluentResults;

namespace ChoirApp.Domain.Tests;

public class ChoirTests
{
    private User CreateAdminUser() => User.Create("google-admin-id", "Admin User", "admin@test.com").Value;
    private User CreateMemberUser() => User.Create("google-member-id", "Member User", "member@test.com").Value;

    [Fact]
    public void Create_WithValidNameAndAdminId_ShouldSucceed()
    {
        // Arrange
        var admin = CreateAdminUser();

        // Act
        var result = Choir.Create("Test Choir", admin.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var choir = result.Value;
        choir.ChoirName.Should().Be("Test Choir");
        choir.AdminUserId.Should().Be(admin.UserId);
        choir.UserChoirs.Should().BeEmpty(); // Create does not automatically add the admin as a member.
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void Create_WithInvalidName_ShouldFail(string invalidName)
    {
        // Arrange
        var admin = CreateAdminUser();

        // Act
        var result = Choir.Create(invalidName, admin.UserId);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Choir name cannot be empty.");
    }

    [Fact]
    public void Create_WithEmptyAdminId_ShouldFail()
    {
        // Act
        var result = Choir.Create("Test Choir", Guid.Empty);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "A choir must have an admin.");
    }

    [Fact]
    public void UpdateName_WithValidName_ShouldSucceed()
    {
        // Arrange
        var admin = CreateAdminUser();
        var choir = Choir.Create("Old Name", admin.UserId).Value;

        // Act
        var result = choir.UpdateName("New Name");

        // Assert
        result.IsSuccess.Should().BeTrue();
        choir.ChoirName.Should().Be("New Name");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void UpdateName_WithInvalidName_ShouldFail(string invalidName)
    {
        // Arrange
        var admin = CreateAdminUser();
        var choir = Choir.Create("Test Choir", admin.UserId).Value;

        // Act
        var result = choir.UpdateName(invalidName);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Choir name cannot be empty.");
    }

    [Fact]
    public void AddMember_WhenNotAlreadyMember_ShouldSucceed()
    {
        // Arrange
        var admin = CreateAdminUser();
        var member = CreateMemberUser();
        var choir = Choir.Create("Test Choir", admin.UserId).Value;

        // Act
        var result = choir.AddMember(member);

        // Assert
        result.IsSuccess.Should().BeTrue();
        choir.UserChoirs.Should().ContainSingle(uc => uc.UserId == member.UserId && uc.ChoirId == choir.ChoirId);
    }

    [Fact]
    public void AddMember_WhenAlreadyMember_ShouldFail()
    {
        // Arrange
        var admin = CreateAdminUser();
        var member = CreateMemberUser();
        var choir = Choir.Create("Test Choir", admin.UserId).Value;
        choir.AddMember(member); // Add once

        // Act
        var result = choir.AddMember(member); // Add again

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "User is already a member of this choir.");
    }

    [Fact]
    public void RemoveMember_WhenMemberExistsAndIsNotAdmin_ShouldSucceed()
    {
        // Arrange
        var admin = CreateAdminUser();
        var member = CreateMemberUser();
        var choir = Choir.Create("Test Choir", admin.UserId).Value;
        choir.AddMember(member);

        // Act
        var result = choir.RemoveMember(member.UserId, admin.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        choir.UserChoirs.Should().BeEmpty();
    }

    [Fact]
    public void RemoveMember_WhenMemberDoesNotExist_ShouldFail()
    {
        // Arrange
        var admin = CreateAdminUser();
        var member = CreateMemberUser();
        var choir = Choir.Create("Test Choir", admin.UserId).Value;

        // Act
        var result = choir.RemoveMember(member.UserId, admin.UserId);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Member not found in this choir.");
    }
    
    [Fact]
    public void RemoveMember_WhenRequestingUserIsNotAdmin_ShouldFail()
    {
        // Arrange
        var admin = CreateAdminUser();
        var member = CreateMemberUser();
        var otherUser = User.Create("google-other-id", "Other User", "other@test.com").Value;
        var choir = Choir.Create("Test Choir", admin.UserId).Value;
        choir.AddMember(member);

        // Act
        var result = choir.RemoveMember(member.UserId, otherUser.UserId);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Only the choir admin can remove members.");
    }

    [Fact]
    public void RemoveMember_WhenRemovingAdmin_ShouldFail()
    {
        // Arrange
        var admin = CreateAdminUser();
        var choir = Choir.Create("Test Choir", admin.UserId).Value;
        choir.AddMember(admin); // Admin must be a member to be removed

        // Act
        var result = choir.RemoveMember(admin.UserId, admin.UserId);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "The choir admin cannot be removed.");
    }
}
