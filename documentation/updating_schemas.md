## State
It is important to keep storage schemas up to date. This document outlines the steps to update storage schemas effectively. The **state** and **settings** objects are crucial components of the storage schema.

In order to update the state or settings schema, follow these steps:
1. create a new type for the new version of the schema
2. create migration functions to convert from the old version to the new version and vice versa
3. update the LATEST_VERSION and LATEST_STATE constants to point to the new version
4. update the State and Settings types to include the use of the new version

This process ensures that the storage schema remains current and compatible with existing data. It prevents data loss and maintains the integrity of the storage system.
