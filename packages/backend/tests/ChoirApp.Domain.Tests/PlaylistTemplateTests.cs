using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class PlaylistTemplateTests
{
    [Fact]
    public void PlaylistTemplate_CanBeCreated_WithValidData()
    {
        // Arrange
        var templateId = Guid.NewGuid();
        var choirId = Guid.NewGuid();
        var title = "Mass Parts Template";
        var description = "Standard template for mass parts.";
        var creationDate = DateTimeOffset.UtcNow;

        // Act
        var playlistTemplate = new PlaylistTemplate
        {
            TemplateId = templateId,
            ChoirId = choirId,
            Title = title,
            Description = description,
            CreationDate = creationDate
        };

        // Assert
        playlistTemplate.Should().NotBeNull();
        playlistTemplate.TemplateId.Should().Be(templateId);
        playlistTemplate.ChoirId.Should().Be(choirId);
        playlistTemplate.Title.Should().Be(title);
        playlistTemplate.Description.Should().Be(description);
        playlistTemplate.CreationDate.Should().Be(creationDate);
        playlistTemplate.Choir.Should().BeNull();
        playlistTemplate.Playlists.Should().BeEmpty();
        playlistTemplate.PlaylistTemplateSections.Should().BeEmpty();
    }

    [Fact]
    public void PlaylistTemplate_Title_IsInitializedToEmptyString()
    {
        // Arrange & Act
        var playlistTemplate = new PlaylistTemplate();

        // Assert
        playlistTemplate.Title.Should().Be(string.Empty);
    }
}
