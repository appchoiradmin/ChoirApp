using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class PlaylistTemplateSectionTests
{
    [Fact]
    public void PlaylistTemplateSection_CanBeCreated_WithValidData()
    {
        // Arrange
        var templateSectionId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var title = "Opening Songs";
        var orderIndex = 1;

        // Act
        var playlistTemplateSection = new PlaylistTemplateSection
        {
            TemplateSectionId = templateSectionId,
            TemplateId = templateId,
            Title = title,
            OrderIndex = orderIndex
        };

        // Assert
        playlistTemplateSection.Should().NotBeNull();
        playlistTemplateSection.TemplateSectionId.Should().Be(templateSectionId);
        playlistTemplateSection.TemplateId.Should().Be(templateId);
        playlistTemplateSection.Title.Should().Be(title);
        playlistTemplateSection.OrderIndex.Should().Be(orderIndex);
        playlistTemplateSection.PlaylistTemplate.Should().BeNull();
        playlistTemplateSection.PlaylistTemplateSongs.Should().BeEmpty();
    }

    [Fact]
    public void PlaylistTemplateSection_Title_IsInitializedToEmptyString()
    {
        // Arrange & Act
        var playlistTemplateSection = new PlaylistTemplateSection();

        // Assert
        playlistTemplateSection.Title.Should().Be(string.Empty);
    }
}
