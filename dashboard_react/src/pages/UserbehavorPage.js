import React, { useState, useEffect } from "react";
import { fetchActiveUsers, fetchAverageUsageTime, fetchFeedbackCount } from "../api/requests";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";