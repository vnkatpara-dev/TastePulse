import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp, 
  runTransaction,
  DocumentSnapshot,
  QueryConstraint
} from "firebase/firestore";
import { Review, Restaurant } from "./api";

/**
 * Generate a deterministic review document ID.
 * Guarantees at the Firestore Security Rule and database level that a user
 * can only ever create one review per restaurant.
 */
export const getReviewDocId = (restaurantId: string, authorUid: string): string => {
  return `${restaurantId}_${authorUid}`;
};

/**
 * Add a review directly to Firestore using client SDK and atomic transaction.
 * Security Rules evaluate this write directly (authorUid check + deterministic ID + immutability).
 */
export const addReviewDirect = async (review: {
  restaurantId: string;
  restaurantName: string;
  rating: number;
  text: string;
  category: string;
  customerName?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  confidence: number;
}): Promise<Review> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Authentication required to submit a review.");
  }

  const reviewId = getReviewDocId(review.restaurantId, user.uid);
  const reviewRef = doc(db, "reviews", reviewId);
  const restaurantRef = doc(db, "restaurants", review.restaurantId);

  await runTransaction(db, async (transaction) => {
    // 1. Check if review document already exists
    const reviewSnap = await transaction.get(reviewRef);
    if (reviewSnap.exists()) {
      throw new Error("You have already reviewed this restaurant. Duplicate reviews are not permitted.");
    }

    // 2. Read current restaurant aggregate state
    const restaurantSnap = await transaction.get(restaurantRef);
    if (restaurantSnap.exists()) {
      const rData = restaurantSnap.data();
      const currentTotal = rData.totalReviews || 0;
      const currentSum = rData.ratingSum || ((rData.averageRating || 0) * currentTotal);
      
      const newTotal = currentTotal + 1;
      const newSum = currentSum + review.rating;
      const newAvg = Math.round((newSum / newTotal) * 100) / 100;

      transaction.update(restaurantRef, {
        totalReviews: newTotal,
        ratingSum: newSum,
        averageRating: newAvg
      });
    }

    // 3. Write review document with server timestamp
    const reviewData = {
      id: reviewId,
      restaurantId: review.restaurantId,
      restaurantName: review.restaurantName,
      authorUid: user.uid,
      customerName: review.customerName || user.displayName || user.email?.split('@')[0] || "Customer",
      rating: review.rating,
      text: review.text,
      category: review.category,
      sentiment: review.sentiment,
      sentimentScore: review.sentimentScore,
      confidence: review.confidence,
      createdAt: serverTimestamp()
    };

    transaction.set(reviewRef, reviewData);
  });

  return {
    id: reviewId,
    restaurantId: review.restaurantId,
    restaurantName: review.restaurantName,
    authorUid: user.uid,
    customerName: review.customerName || user.displayName || "Customer",
    rating: review.rating,
    text: review.text,
    category: review.category,
    sentiment: review.sentiment,
    sentimentScore: review.sentimentScore,
    confidence: review.confidence,
    date: new Date().toISOString().split('T')[0]
  };
};

/**
 * Delete a review directly from Firestore using atomic transaction.
 * Security Rules independently enforce authorUid == auth.uid || role == 'owner'.
 */
export const deleteReviewDirect = async (reviewId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Authentication required to delete a review.");
  }

  const reviewRef = doc(db, "reviews", reviewId);

  await runTransaction(db, async (transaction) => {
    const reviewSnap = await transaction.get(reviewRef);
    if (!reviewSnap.exists()) {
      throw new Error("Review not found.");
    }

    const reviewData = reviewSnap.data();
    const restaurantId = reviewData.restaurantId;
    const rating = reviewData.rating || 0;

    if (restaurantId) {
      const restaurantRef = doc(db, "restaurants", restaurantId);
      const restaurantSnap = await transaction.get(restaurantRef);
      if (restaurantSnap.exists()) {
        const rData = restaurantSnap.data();
        const currentTotal = rData.totalReviews || 0;
        const currentSum = rData.ratingSum || ((rData.averageRating || 0) * currentTotal);
        
        if (currentTotal > 1) {
          const newTotal = currentTotal - 1;
          const newSum = Math.max(0, currentSum - rating);
          const newAvg = Math.round((newSum / newTotal) * 100) / 100;
          transaction.update(restaurantRef, {
            totalReviews: newTotal,
            ratingSum: newSum,
            averageRating: newAvg
          });
        } else {
          transaction.update(restaurantRef, {
            totalReviews: 0,
            ratingSum: 0,
            averageRating: 0
          });
        }
      }
    }

    transaction.delete(reviewRef);
  });
};

/**
 * Fetch reviews directly from Firestore using composite index query cursor.
 */
export const getReviewsDirect = async (options?: {
  restaurantId?: string;
  restaurantName?: string;
  pageSize?: number;
  startAfterDoc?: DocumentSnapshot;
}): Promise<{ reviews: Review[]; lastDoc: DocumentSnapshot | null }> => {
  const constraints: QueryConstraint[] = [];

  if (options?.restaurantId) {
    constraints.push(where("restaurantId", "==", options.restaurantId));
  } else if (options?.restaurantName) {
    constraints.push(where("restaurantName", "==", options.restaurantName));
  }

  constraints.push(orderBy("createdAt", "desc"));

  if (options?.startAfterDoc) {
    constraints.push(startAfter(options.startAfterDoc));
  }

  constraints.push(limit(options?.pageSize || 20));

  const q = query(collection(db, "reviews"), ...constraints);
  const snapshot = await getDocs(q);

  const reviews: Review[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const createdDate = data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : (data.date || new Date().toISOString().split('T')[0]);
    reviews.push({
      id: docSnap.id,
      restaurantId: data.restaurantId,
      restaurantName: data.restaurantName,
      authorUid: data.authorUid,
      customerName: data.customerName,
      rating: data.rating,
      text: data.text,
      sentiment: data.sentiment,
      sentimentScore: data.sentimentScore,
      confidence: data.confidence,
      date: createdDate,
      category: data.category,
      ownerReply: data.ownerReply,
      ownerReplyDate: data.ownerReplyDate
    });
  });

  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  return { reviews, lastDoc };
};
