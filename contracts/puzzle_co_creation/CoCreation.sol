// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CoCreation
 * @dev Allows multiple creators to collaboratively create puzzles with royalty sharing
 */
contract CoCreation {
    // Types
    enum Status {
        Draft,
        PendingSignatures,
        Published
    }

    struct Creator {
        address creatorAddress;
        uint256 basisPoints; // Share in basis points (10000 = 100%)
        bool hasSigned;
    }

    struct CoCreationData {
        uint256 puzzleId;
        Creator[] creators;
        Status status;
        uint256 signatureCount;
        mapping(address => bool) isCreator;
    }

    // State
    uint256 public coCreationCounter;
    mapping(uint256 => CoCreationData) public coCreations;
    mapping(uint256 => mapping(address => bool)) public hasSigned;

    // Events
    event CoCreationInitiated(
        uint256 indexed coCreationId,
        uint256 indexed puzzleId,
        address[] creators,
        uint256[] shares
    );
    event SignatureAdded(
        uint256 indexed coCreationId,
        address indexed creator
    );
    event SignatureWithdrawn(
        uint256 indexed coCreationId,
        address indexed creator
    );
    event PuzzlePublished(uint256 indexed coCreationId, uint256 indexed puzzleId);
    event RoyaltySplit(
        uint256 indexed coCreationId,
        address indexed creator,
        uint256 amount
    );

    // Errors
    error InvalidShareTotal();
    error NotCreator();
    error AlreadySigned();
    error NotAllCreatorsSigned();
    error AlreadyPublished();
    error NotDraftOrPending();
    error InvalidCoCreationId();
    error UnauthorizedRoyaltyDistribution();

    // Modifiers
    modifier onlyCreator(uint256 coCreationId) {
        if (!coCreations[coCreationId].isCreator[msg.sender]) {
            revert NotCreator();
        }
        _;
    }

    modifier validCoCreation(uint256 coCreationId) {
        if (coCreationId == 0 || coCreationId > coCreationCounter) {
            revert InvalidCoCreationId();
        }
        _;
    }

    /**
     * @dev Initialize a new co-creation collaboration
     * @param puzzleId The ID of the puzzle being co-created
     * @param creatorAddresses Array of creator addresses
     * @param basisPoints Array of basis points for each creator (must sum to 10000)
     */
    function initiate(
        uint256 puzzleId,
        address[] calldata creatorAddresses,
        uint256[] calldata basisPoints
    ) external returns (uint256) {
        require(
            creatorAddresses.length == basisPoints.length,
            "Arrays length mismatch"
        );
        require(creatorAddresses.length > 0, "No creators provided");

        // Validate basis points sum to 10000
        uint256 totalBasisPoints = 0;
        for (uint256 i = 0; i < basisPoints.length; i++) {
            totalBasisPoints += basisPoints[i];
        }
        if (totalBasisPoints != 10000) {
            revert InvalidShareTotal();
        }

        // Create new co-creation
        uint256 coCreationId = ++coCreationCounter;
        CoCreationData storage coCreation = coCreations[coCreationId];
        coCreation.puzzleId = puzzleId;
        coCreation.status = Status.PendingSignatures;
        coCreation.signatureCount = 0;

        // Add creators
        for (uint256 i = 0; i < creatorAddresses.length; i++) {
            address creatorAddr = creatorAddresses[i];
            coCreation.creators.push(
                Creator({
                    creatorAddress: creatorAddr,
                    basisPoints: basisPoints[i],
                    hasSigned: false
                })
            );
            coCreation.isCreator[creatorAddr] = true;
        }

        // Lead creator (msg.sender) signs automatically
        _addSignature(coCreationId);

        emit CoCreationInitiated(
            coCreationId,
            puzzleId,
            creatorAddresses,
            basisPoints
        );

        return coCreationId;
    }

    /**
     * @dev Sign off on the co-creation
     * @param coCreationId The ID of the co-creation
     */
    function sign(uint256 coCreationId)
        external
        validCoCreation(coCreationId)
        onlyCreator(coCreationId)
    {
        CoCreationData storage coCreation = coCreations[coCreationId];
        require(coCreation.status != Status.Published, "Already published");

        if (hasSigned[coCreationId][msg.sender]) {
            revert AlreadySigned();
        }

        _addSignature(coCreationId);

        emit SignatureAdded(coCreationId, msg.sender);
    }

    /**
     * @dev Withdraw signature before all creators have signed
     * @param coCreationId The ID of the co-creation
     */
    function withdrawSignature(uint256 coCreationId)
        external
        validCoCreation(coCreationId)
        onlyCreator(coCreationId)
    {
        CoCreationData storage coCreation = coCreations[coCreationId];
        require(coCreation.status == Status.PendingSignatures, "Not in pending state");
        require(hasSigned[coCreationId][msg.sender], "Not signed");

        // Remove signature
        hasSigned[coCreationId][msg.sender] = false;
        coCreation.signatureCount--;

        // Update creator's signed status
        for (uint256 i = 0; i < coCreation.creators.length; i++) {
            if (coCreation.creators[i].creatorAddress == msg.sender) {
                coCreation.creators[i].hasSigned = false;
                break;
            }
        }

        // If signature count drops below threshold, revert to draft
        if (coCreation.signatureCount == 0) {
            coCreation.status = Status.Draft;
        }

        emit SignatureWithdrawn(coCreationId, msg.sender);
    }

    /**
     * @dev Publish the puzzle once all creators have signed
     * @param coCreationId The ID of the co-creation
     */
    function publish(uint256 coCreationId)
        external
        validCoCreation(coCreationId)
        onlyCreator(coCreationId)
    {
        CoCreationData storage coCreation = coCreations[coCreationId];

        if (coCreation.status == Status.Published) {
            revert AlreadyPublished();
        }

        if (coCreation.signatureCount != coCreation.creators.length) {
            revert NotAllCreatorsSigned();
        }

        coCreation.status = Status.Published;

        emit PuzzlePublished(coCreationId, coCreation.puzzleId);
    }

    /**
     * @dev Distribute royalties to creators based on their shares
     * @param coCreationId The ID of the co-creation
     * @param totalAmount Total royalty amount to distribute
     */
    function distributeRoyalty(uint256 coCreationId, uint256 totalAmount)
        external
        validCoCreation(coCreationId)
    {
        CoCreationData storage coCreation = coCreations[coCreationId];

        // Only published co-creations can receive royalties
        if (coCreation.status != Status.Published) {
            revert UnauthorizedRoyaltyDistribution();
        }

        require(totalAmount > 0, "Amount must be greater than 0");

        // Distribute to each creator
        for (uint256 i = 0; i < coCreation.creators.length; i++) {
            Creator memory creator = coCreation.creators[i];
            uint256 share = (totalAmount * creator.basisPoints) / 10000;

            if (share > 0) {
                payable(creator.creatorAddress).transfer(share);
                emit RoyaltySplit(coCreationId, creator.creatorAddress, share);
            }
        }
    }

    /**
     * @dev Get co-creation details
     * @param coCreationId The ID of the co-creation
     */
    function getCoCreation(uint256 coCreationId)
        external
        view
        validCoCreation(coCreationId)
        returns (
            uint256 puzzleId,
            address[] memory creators,
            uint256[] memory shares,
            bool[] memory signedStatuses,
            Status status,
            uint256 signatureCount
        )
    {
        CoCreationData storage coCreation = coCreations[coCreationId];

        creators = new address[](coCreation.creators.length);
        shares = new uint256[](coCreation.creators.length);
        signedStatuses = new bool[](coCreation.creators.length);

        for (uint256 i = 0; i < coCreation.creators.length; i++) {
            creators[i] = coCreation.creators[i].creatorAddress;
            shares[i] = coCreation.creators[i].basisPoints;
            signedStatuses[i] = coCreation.creators[i].hasSigned;
        }

        return (
            coCreation.puzzleId,
            creators,
            shares,
            signedStatuses,
            coCreation.status,
            coCreation.signatureCount
        );
    }

    /**
     * @dev Internal function to add signature
     * @param coCreationId The ID of the co-creation
     */
    function _addSignature(uint256 coCreationId) private {
        CoCreationData storage coCreation = coCreations[coCreationId];

        hasSigned[coCreationId][msg.sender] = true;
        coCreation.signatureCount++;

        // Update creator's signed status
        for (uint256 i = 0; i < coCreation.creators.length; i++) {
            if (coCreation.creators[i].creatorAddress == msg.sender) {
                coCreation.creators[i].hasSigned = true;
                break;
            }
        }
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
