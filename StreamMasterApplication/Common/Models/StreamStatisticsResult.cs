﻿namespace StreamMasterApplication.Common.Models;

public class StreamStatisticsResult
{
    public double InputBitsPerSecond { get; set; }
    public long InputBytesRead { get; set; }
    public long InputBytesWritten { get; set; }
    public TimeSpan InputElapsedTime => DateTimeOffset.UtcNow - InputStartTime;
    public DateTimeOffset InputStartTime { get; set; }

    public double ClientBitsPerSecond { get; set; }
    public long ClientBytesRead { get; set; }
    public long ClientBytesWritten { get; set; }
    public TimeSpan ClientElapsedTime => DateTimeOffset.UtcNow - ClientStartTime;
    public DateTimeOffset ClientStartTime { get; set; }
    public Guid ClientId { get; set; }

    //public List<ClientStreamingStatistics> ClientStatistics { get; set; }
    //public StreamingStatistics InputStreamStatistics { get; set; }

    public string? Logo { get; set; }

    /// <summary>
    /// Gets or sets the identifier for the M3U stream.
    /// </summary>
    public int M3UStreamId { get; set; }

    /// <summary>
    /// Gets or sets the name of the M3U stream.
    /// </summary>
    public string M3UStreamName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the type of the streaming proxy.
    /// </summary>
    public StreamingProxyTypes M3UStreamProxyType { get; set; }

    public string? StreamUrl { get; set; }
}

public class StreamInfo
{
    public string? Logo { get; set; }

    /// <summary>
    /// Gets or sets the identifier for the M3U stream.
    /// </summary>
    public int M3UStreamId { get; set; }

    /// <summary>
    /// Gets or sets the name of the M3U stream.
    /// </summary>
    public string M3UStreamName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the type of the streaming proxy.
    /// </summary>
    public StreamingProxyTypes StreamProxyType { get; set; }

    public string? StreamUrl { get; set; }
}